import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../i18n/i18nContext';
import { PurchaseOrder, POStatus, Supplier, Product, UserRole } from '../types';
import { inventoryAPI } from '../api/inventory';
import { productsAPI } from '../api/products';

export const PurchaseOrdersPage = () => {
  const { user } = useAuthStore();
  const { t, language } = useTranslation();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<POStatus | ''>('');

  const [formData, setFormData] = useState({
    supplier_id: '',
    expected_date: '',
    notes: '',
    items: [{ product_id: '', quantity: 1, unit_price: 0 }],
  });

  const canCreate = [UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MANAGER].includes(user?.role as UserRole);
  const canApprove = [UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN].includes(user?.role as UserRole);

  useEffect(() => {
    loadPurchaseOrders();
    loadSuppliers();
    loadProducts();
  }, [filterStatus]);

  const loadPurchaseOrders = async () => {
    setIsLoading(true);
    try {
      const result = await inventoryAPI.listPurchaseOrders(filterStatus ? { status: filterStatus } : undefined);
      setPurchaseOrders(result.data || []);
    } catch (err) {
      console.error('Failed to load purchase orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await inventoryAPI.listSuppliers({ is_active: true });
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  };

  const loadProducts = async () => {
    try {
      const result = await productsAPI.list({ is_active: true, limit: 1000 });
      setProducts(result.data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 1, unit_price: 0 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill price when product is selected
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unit_price = Number(product.cost) || Number(product.price);
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validItems = formData.items.filter(item => item.product_id && item.quantity > 0);
      if (validItems.length === 0) {
        alert('Please add at least one item');
        return;
      }

      await inventoryAPI.createPurchaseOrder({
        supplier_id: formData.supplier_id,
        expected_date: formData.expected_date || undefined,
        notes: formData.notes || undefined,
        items: validItems,
      });

      alert('✅ Purchase Order created successfully!');
      setShowModal(false);
      setFormData({
        supplier_id: '',
        expected_date: '',
        notes: '',
        items: [{ product_id: '', quantity: 1, unit_price: 0 }],
      });
      loadPurchaseOrders();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create purchase order');
    }
  };

  const handleApprove = async (id: string, poNumber: string) => {
    if (!window.confirm(`Approve Purchase Order ${poNumber}?`)) return;

    try {
      await inventoryAPI.approvePurchaseOrder(id);
      alert('✅ Purchase Order approved!');
      loadPurchaseOrders();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to approve purchase order');
    }
  };

  const getStatusBadge = (status: POStatus) => {
    const badges = {
      [POStatus.DRAFT]: 'bg-gray-100 text-gray-700',
      [POStatus.SUBMITTED]: 'bg-blue-100 text-blue-700',
      [POStatus.APPROVED]: 'bg-green-100 text-green-700',
      [POStatus.PARTIALLY_RECEIVED]: 'bg-yellow-100 text-yellow-700',
      [POStatus.RECEIVED]: 'bg-purple-100 text-purple-700',
      [POStatus.CANCELLED]: 'bg-red-100 text-red-700',
    };
    return badges[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="glass rounded-3xl p-6 shadow-xl animate-slide-down flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">{t.nav.purchaseOrders}</h1>
            <p className="text-slate-600 text-sm">{t.inventory.managePurchaseOrders || 'Create and manage purchase orders'}</p>
          </div>
          {canCreate && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Purchase Order
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="glass rounded-2xl p-4 shadow-lg">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-semibold text-slate-700">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as POStatus | '')}
              className="input-field flex-1 max-w-xs"
            >
              <option value="">All Status</option>
              <option value={POStatus.DRAFT}>Draft</option>
              <option value={POStatus.SUBMITTED}>Submitted</option>
              <option value={POStatus.APPROVED}>Approved</option>
              <option value={POStatus.PARTIALLY_RECEIVED}>Partially Received</option>
              <option value={POStatus.RECEIVED}>Received</option>
              <option value={POStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>
        </div>

        {/* Purchase Orders List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-12 text-center glass rounded-3xl">
              <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-600">Loading purchase orders...</p>
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="p-12 text-center glass rounded-3xl">
              <p className="text-slate-600 mb-4">No purchase orders found</p>
              {canCreate && (
                <button onClick={() => setShowModal(true)} className="btn-primary">
                  Create First Purchase Order
                </button>
              )}
            </div>
          ) : (
            purchaseOrders.map((po, index) => (
              <div
                key={po.id}
                className="glass rounded-2xl p-6 shadow-lg animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-800">{po.po_number}</h3>
                      <span className={`px-4 py-1 rounded-xl font-semibold text-xs ${getStatusBadge(po.status)}`}>
                        {po.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Supplier: <span className="font-semibold">{po.supplier?.name || 'Unknown'}</span>
                    </p>
                    {po.expected_date && (
                      <p className="text-sm text-slate-500">
                        Expected: {new Date(po.expected_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">${Number(po.total_amount || 0).toFixed(2)}</div>
                    <div className="text-xs text-slate-500">
                      {po._count?.items || 0} items • {po._count?.goods_receipts || 0} receipts
                    </div>
                  </div>
                </div>

                {po.notes && (
                  <div className="mb-4 p-3 glass rounded-lg">
                    <div className="text-xs font-semibold text-slate-600 mb-1">Notes:</div>
                    <div className="text-sm text-slate-700">{po.notes}</div>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-slate-500 mb-4">
                  <span>Created: {new Date(po.created_at).toLocaleDateString()}</span>
                  {po.approved_at && <span>Approved: {new Date(po.approved_at).toLocaleDateString()}</span>}
                </div>

                {canApprove && po.status === POStatus.DRAFT && (
                  <button
                    onClick={() => handleApprove(po.id, po.po_number)}
                    className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition-colors"
                  >
                    ✓ Approve Purchase Order
                  </button>
                )}

                {po.status === POStatus.APPROVED && (
                  <div className="glass rounded-lg p-3 bg-blue-50/50 border border-blue-200">
                    <p className="text-sm text-blue-800">
                      ✓ Approved - Ready to receive goods via GRN
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create PO Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="glass rounded-3xl p-8 max-w-4xl w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{t.inventory.createPurchaseOrder || 'Create Purchase Order'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Supplier & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Supplier *</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    required
                    className="input-field"
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Expected Date</label>
                  <input
                    type="date"
                    value={formData.expected_date}
                    onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Items</h3>
                  <button type="button" onClick={handleAddItem} className="btn-secondary text-sm">
                    + Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="glass rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Product</label>
                          <select
                            value={item.product_id}
                            onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                            required
                            className="input-field text-sm"
                          >
                            <option value="">Select...</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku}) - Stock: {p.stock_quantity}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            required
                            min="1"
                            className="input-field text-sm"
                          />
                        </div>

                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Price</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              required
                              min="0"
                              className="input-field text-sm"
                            />
                          </div>
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {item.product_id && item.quantity > 0 && (
                        <div className="mt-2 text-sm text-slate-600">
                          Subtotal: <span className="font-bold text-primary-600">${(Number(item.quantity || 0) * Number(item.unit_price || 0)).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-4 p-4 glass rounded-xl bg-primary-50/30">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-800">Total Amount:</span>
                    <span className="text-3xl font-bold text-primary-600">${Number(calculateTotal() || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                  rows={2}
                  placeholder={language === 'ar' ? 'ملاحظات اختيارية...' : 'Optional notes...'}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {language === 'ar' ? 'إنشاء أمر شراء' : 'Create Purchase Order'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-8">
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

