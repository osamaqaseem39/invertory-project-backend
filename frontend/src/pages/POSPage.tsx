import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { ReceiptModal } from '../components/ReceiptModal';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../i18n/i18nContext';
import { Product, Customer, POSSession, POSTransactionItem, PaymentMethod, POSSessionStatus } from '../types';
import { productsAPI } from '../api/products';
import { salesAPI } from '../api/sales';
import { receiptsAPI, ReceiptData } from '../api/receipts';

interface CartItem extends POSTransactionItem {
  product: Product;
}

export const POSPage = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amountTendered, setAmountTendered] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // POS Session state
  const [currentSession, setCurrentSession] = useState<POSSession | null>(null);
  const [startingCash, setStartingCash] = useState<number>(0);
  const [endingCash, setEndingCash] = useState<number>(0);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  
  // Barcode Scanner state
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Receipt state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [currentReceiptId, setCurrentReceiptId] = useState<string>('');

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        // Load products and customers first
        await loadData();
        
        // Then check session only if user is ready
        if (user?.id) {
          await checkActiveSession();
        }
      } catch (err: any) {
        setError('Failed to initialize POS system');
        console.error('POS initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, []);

  // Separate effect to check session when user becomes available
  useEffect(() => {
    if (user?.id && !currentSession && !showSessionModal) {
      checkActiveSession();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [productsResponse, customersResponse] = await Promise.all([
        productsAPI.list({ is_active: true, limit: 1000 }),
        salesAPI.customers.list({ is_active: true, limit: 1000 }),
      ]);
      
      setProducts(productsResponse.data || []);
      setCustomers(customersResponse.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const checkActiveSession = async () => {
    // Guard: Don't check if user not loaded
    if (!user?.id) {
      console.warn('User not loaded yet, skipping session check');
      return;
    }

    try {
      const sessionsResponse = await salesAPI.pos.listSessions({ 
        cashier_id: user.id,
        status: POSSessionStatus.ACTIVE 
      });
      
      if (sessionsResponse.data && sessionsResponse.data.length > 0) {
        setCurrentSession(sessionsResponse.data[0]);
      } else {
        setShowSessionModal(true);
      }
    } catch (err) {
      console.error('Failed to check active session:', err);
      setShowSessionModal(true);
    }
  };

  const startSession = async () => {
    if (startingCash < 0) {
      setError('Starting cash cannot be negative');
      return;
    }

    setIsProcessing(true);
    try {
      const session = await salesAPI.pos.startSession(startingCash);
      setCurrentSession(session);
      setShowSessionModal(false);
      setStartingCash(0);
      setSuccess('POS session started successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to start session');
    } finally {
      setIsProcessing(false);
    }
  };

  const endSession = async () => {
    if (!currentSession) return;

    setIsProcessing(true);
    try {
      await salesAPI.pos.endSession(currentSession.id, endingCash);
      setCurrentSession(null);
      setShowEndSessionModal(false);
      setEndingCash(0);
      setSuccess('POS session ended successfully');
      setTimeout(() => setSuccess(''), 3000);
      // Redirect to login or show session summary
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to end session');
    } finally {
      setIsProcessing(false);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      setError('Product is out of stock');
      return;
    }

    const existingItem = cart.find(item => item.product_id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        setError('Cannot add more items - insufficient stock');
        return;
      }
      updateCartItemQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        id: `temp-${Date.now()}`,
        transaction_id: '',
        product_id: product.id,
        product,
        quantity: 1,
        unit_price: Number(product.price),
        discount_percentage: 0,
        line_total: Number(product.price),
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock_quantity) {
      setError('Cannot add more items - insufficient stock');
      return;
    }

    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const lineTotal = newQuantity * item.unit_price * (1 - (item.discount_percentage || 0) / 100);
        return { ...item, quantity: newQuantity, line_total: lineTotal };
      }
      return item;
    }));
  };

  const updateCartItemPrice = (productId: string, newPrice: number) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const lineTotal = item.quantity * newPrice * (1 - (item.discount_percentage || 0) / 100);
        return { ...item, unit_price: newPrice, line_total: lineTotal };
      }
      return item;
    }));
  };

  const updateCartItemDiscount = (productId: string, discountPercent: number) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const lineTotal = item.quantity * item.unit_price * (1 - discountPercent / 100);
        return { ...item, discount_percentage: discountPercent, line_total: lineTotal };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.line_total, 0);
  };

  const calculateTax = () => {
    // TODO: Implement tax calculation
    return 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const calculateChange = () => {
    return Math.max(0, amountTendered - calculateTotal());
  };

  const processSale = async () => {
    // ===== VALIDATION =====
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    if (!currentSession) {
      setError('No active POS session');
      return;
    }

    // Validate cart items
    for (const item of cart) {
      if (item.quantity <= 0) {
        setError(`Invalid quantity for ${item.product.name}`);
        return;
      }
      if (item.unit_price < 0) {
        setError(`Invalid price for ${item.product.name}`);
        return;
      }
      if ((item.discount_percentage || 0) < 0 || (item.discount_percentage || 0) > 100) {
        setError(`Invalid discount for ${item.product.name}`);
        return;
      }
      
      // Check stock availability
      const product = products.find(p => p.id === item.product_id);
      if (!product || item.quantity > product.stock_quantity) {
        setError(`Insufficient stock for ${item.product.name}`);
        return;
      }
    }

    const total = calculateTotal();

    // Validate payment
    if (paymentMethod === PaymentMethod.CASH) {
      if (!amountTendered || amountTendered <= 0) {
        setError('Please enter amount tendered');
        return;
      }
      if (amountTendered < total) {
        setError(`Amount tendered ($${amountTendered.toFixed(2)}) is less than total ($${total.toFixed(2)})`);
        return;
      }
    } else {
      // For non-cash payments, set amount tendered to total
      setAmountTendered(total);
    }

    setIsProcessing(true);
    setError(''); // Clear any previous errors
    
    try {
      const transaction = await salesAPI.pos.processTransaction({
        session_id: currentSession.id,
        transaction_type: 'SALE',
        customer_id: selectedCustomer?.id,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage,
        })),
        payment_method: paymentMethod,
        amount_tendered: paymentMethod === PaymentMethod.CASH ? amountTendered : total,
        notes: notes,
      });

      // ===== GENERATE RECEIPT =====
      try {
        const receipt = await receiptsAPI.generateReceipt(transaction.id);
        setReceiptData(receipt.receipt_data);
        setCurrentReceiptId(receipt.receipt.id);
        setShowReceiptModal(true);
      } catch (receiptErr) {
        console.error('Failed to generate receipt:', receiptErr);
        // Don't fail the whole transaction if receipt generation fails
      }

      // Clear cart and reset form
      setCart([]);
      setSelectedCustomer(null);
      setAmountTendered(0);
      setNotes('');
      setSuccess(`Sale completed! Transaction: ${transaction.transaction_number}`);
      
      // Update session data
      setCurrentSession(prev => prev ? {
        ...prev,
        total_sales: Number(prev.total_sales) + total,
        total_transactions: prev.total_transactions + 1,
      } : null);

      // ===== CRITICAL FIX: RELOAD PRODUCTS TO GET UPDATED STOCK =====
      await loadData();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to process sale';
      setError(errorMessage);
      console.error('Sale processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setAmountTendered(0);
    setNotes('');
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setShowBarcodeScanner(false);
    setError('');
    
    try {
      // Search for product by barcode
      const response = await productsAPI.list({ q: barcode, is_active: true, limit: 5 });
      
      if (response.data && response.data.length > 0) {
        // Find exact barcode match first
        let product = response.data.find(p => p.barcode === barcode);
        
        // If no exact barcode match, try SKU
        if (!product) {
          product = response.data.find(p => p.sku === barcode);
        }
        
        // If still no match, use first result
        if (!product) {
          product = response.data[0];
        }
        
        // Add to cart
        addToCart(product);
        setSuccess(`✅ Scanned: ${product.name} - Added to cart!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(`❌ Product not found with barcode: ${barcode}`);
        setTimeout(() => setError(''), 5000);
      }
    } catch (err: any) {
      setError('Failed to search product. Please try manual search.');
      console.error('Barcode search error:', err);
    }
  };

  const handleSearchProducts = async () => {
    if (!searchQuery.trim()) {
      await loadData(); // Reset to all products
      return;
    }

    setIsLoading(true);
    try {
      const response = await productsAPI.list({ 
        q: searchQuery, 
        is_active: true, 
        limit: 100 
      });
      setProducts(response.data || []);
    } catch (err: any) {
      setError('Failed to search products');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentSession && !showSessionModal) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.pos?.startingSession || 'Starting POS Session...'}</h2>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{t.nav.pos}</h1>
                <p className="text-gray-600">
                  {t.pos?.session || 'Session'}: {currentSession?.session_number} | 
                  {t.pos?.cashier || 'Cashier'}: {user?.display_name}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {currentSession && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Session Sales</p>
                    <p className="text-xl font-bold text-green-600">
                      ${Number(currentSession.total_sales).toFixed(2)}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => setShowEndSessionModal(true)}
                  className="btn-danger"
                  disabled={!currentSession}
                >
                  End Session
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">×</button>
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
            <button onClick={() => setSuccess('')} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Main POS Interface */}
        <div className={`flex h-screen pt-20 ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}>
          {/* Left Panel - Products */}
          <div className="w-1/2 p-6 border-r bg-white overflow-y-auto">
            {/* Search and Scanner */}
            <div className="mb-4 space-y-3">
              <h2 className="text-lg font-semibold text-gray-800">Products</h2>
              
              {/* Search Bar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by name, SKU, or barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchProducts()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSearchProducts}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
              
              {/* Barcode Scanner Button */}
              <button
                onClick={() => setShowBarcodeScanner(true)}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                📷 Scan Barcode
              </button>
              
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    loadData();
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ✕ Clear search
                </button>
              )}
            </div>
            
            {/* Products Grid */}
            <div className="mb-4">
              <div className="grid grid-cols-1 gap-2">
                {products.map(product => (
                  <div
                    key={product.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      product.stock_quantity > 0 
                        ? 'hover:bg-blue-50 border-gray-200' 
                        : 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
                    }`}
                    onClick={() => addToCart(product)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{product.name}</h3>
                        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                        <p className="text-sm text-gray-600">Stock: {product.stock_quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">${Number(product.price).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Cart & Checkout */}
          <div className="w-1/2 p-6 bg-gray-50">
            <div className="h-full flex flex-col">
              {/* Cart Header */}
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">Cart</h2>
                  <button
                    onClick={clearCart}
                    className="text-sm text-red-600 hover:text-red-800"
                    disabled={cart.length === 0}
                  >
                    Clear Cart
                  </button>
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto mb-4">
                {cart.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>Cart is empty</p>
                    <p className="text-sm">Add products to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800">{item.product.name}</h3>
                            <p className="text-sm text-gray-600">SKU: {item.product.sku}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product_id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <label className="block text-gray-600 mb-1">Qty</label>
                            <input
                              type="number"
                              min="1"
                              max={item.product.stock_quantity}
                              value={item.quantity}
                              onChange={(e) => updateCartItemQuantity(item.product_id, parseInt(e.target.value) || 1)}
                              className="w-full p-1 border rounded text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 mb-1">Price</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unit_price}
                              onChange={(e) => updateCartItemPrice(item.product_id, parseFloat(e.target.value) || 0)}
                              className="w-full p-1 border rounded text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-600 mb-1">Discount %</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount_percentage || 0}
                              onChange={(e) => updateCartItemDiscount(item.product_id, parseFloat(e.target.value) || 0)}
                              className="w-full p-1 border rounded text-center"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-2 text-right">
                          <span className="font-bold text-blue-600">
                            ${item.line_total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer (Optional)
                </label>
                <select
                  value={selectedCustomer?.id || ''}
                  onChange={(e) => {
                    const customer = customers.find(c => c.id === e.target.value);
                    setSelectedCustomer(customer || null);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name} ({customer.customer_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value={PaymentMethod.CASH}>Cash</option>
                  <option value={PaymentMethod.CREDIT_CARD}>Credit Card</option>
                  <option value={PaymentMethod.DEBIT_CARD}>Debit Card</option>
                  <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
                  <option value={PaymentMethod.CHECK}>Check</option>
                  <option value={PaymentMethod.STORE_CREDIT}>Store Credit</option>
                  <option value={PaymentMethod.OTHER}>Other</option>
                </select>
              </div>

              {/* Amount Tendered */}
              {paymentMethod === PaymentMethod.CASH && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Tendered
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="0.00"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="Transaction notes..."
                />
              </div>

              {/* Totals */}
              <div className="bg-white p-4 rounded-lg border mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Subtotal:</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Tax:</span>
                  <span>${calculateTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                {paymentMethod === PaymentMethod.CASH && amountTendered > 0 && (
                  <div className="flex justify-between text-sm mt-2">
                    <span>Change:</span>
                    <span className="text-green-600 font-bold">
                      ${calculateChange().toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Process Sale Button */}
              <button
                onClick={processSale}
                disabled={cart.length === 0 || isProcessing}
                className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Process Sale'}
              </button>
            </div>
          </div>
        </div>

        {/* Start Session Modal */}
        {showSessionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Start POS Session</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Starting Cash Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={startingCash}
                  onChange={(e) => setStartingCash(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={startSession}
                  disabled={isProcessing}
                  className="flex-1 btn-primary"
                >
                  {isProcessing ? 'Starting...' : 'Start Session'}
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* End Session Modal */}
        {showEndSessionModal && currentSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-bold text-gray-800 mb-4">End POS Session</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Session Summary:</p>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm">Starting Cash: ${Number(currentSession.starting_cash).toFixed(2)}</p>
                  <p className="text-sm">Total Sales: ${Number(currentSession.total_sales).toFixed(2)}</p>
                  <p className="text-sm">Transactions: {currentSession.total_transactions}</p>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ending Cash Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={endingCash}
                  onChange={(e) => setEndingCash(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={endSession}
                  disabled={isProcessing}
                  className="flex-1 btn-danger"
                >
                  {isProcessing ? 'Ending...' : 'End Session'}
                </button>
                <button
                  onClick={() => setShowEndSessionModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Barcode Scanner Modal */}
        {showBarcodeScanner && (
          <BarcodeScanner
            onScan={handleBarcodeScanned}
            onClose={() => setShowBarcodeScanner(false)}
            title="Scan Product Barcode"
            instructions="Point your camera at the product barcode to add it to your cart"
          />
        )}

        {/* Receipt Modal */}
        {showReceiptModal && receiptData && (
          <ReceiptModal
            receiptData={receiptData}
            receiptId={currentReceiptId}
            onClose={() => setShowReceiptModal(false)}
            onEmail={async (email) => {
              try {
                await receiptsAPI.emailReceipt(currentReceiptId, email);
                setSuccess('Receipt emailed successfully!');
                setTimeout(() => setSuccess(''), 3000);
              } catch (err) {
                setError('Failed to email receipt');
                setTimeout(() => setError(''), 3000);
              }
            }}
            onReprint={async () => {
              try {
                const reprinted = await receiptsAPI.reprintReceipt(currentReceiptId);
                setReceiptData(reprinted.receipt_data);
                setSuccess('Receipt reprinted!');
                setTimeout(() => setSuccess(''), 3000);
              } catch (err) {
                setError('Failed to reprint receipt');
                setTimeout(() => setError(''), 3000);
              }
            }}
          />
        )}
      </div>
    </Layout>
  );
};
