import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { FileUpload } from '../components/FileUpload';
import { productsAPI } from '../api/products';
import { inventoryAPI } from '../api/inventory';
import { Category } from '../types';
import { useTranslation } from '../i18n/i18nContext';

export const CreateProductPage = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  
  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    description: '',
    brand: '',
    category_id: '',
    stock_quantity: 0,
    reorder_level: 0,
    reorder_quantity: 0,
    max_stock_level: 0,
    location: '',
    price: 0,
    cost: 0,
    uom: 'unit',
    imageUrl: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showSKUScanner, setShowSKUScanner] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await inventoryAPI.listCategories();
      setCategories(data.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setShowBarcodeScanner(false);
    
    // Check if barcode already exists
    try {
      const response = await productsAPI.list({ q: barcode, limit: 1 });
      
      if (response.data && response.data.length > 0) {
        const existingProduct = response.data.find(p => p.barcode === barcode);
        if (existingProduct) {
          setError(`Product with this barcode already exists: ${existingProduct.name} (${existingProduct.sku})`);
          return;
        }
      }
      
      // Barcode is unique, auto-fill field
      setFormData({...formData, barcode: barcode});
      setSuccess(`✅ Barcode scanned: ${barcode}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Barcode check error:', err);
      setFormData({...formData, barcode: barcode});
      setSuccess(`✅ Barcode scanned: ${barcode}`);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleSKUScanned = (sku: string) => {
    setShowSKUScanner(false);
    setFormData({...formData, sku: sku});
    setSuccess(`✅ SKU scanned: ${sku}`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const productData: any = {
        sku: formData.sku,
        name: formData.name,
        price: formData.price,
        uom: formData.uom,
      };

      if (formData.barcode) productData.barcode = formData.barcode;
      if (formData.description) productData.description = formData.description;
      if (formData.brand) productData.brand = formData.brand;
      if (formData.category_id && formData.category_id.trim()) productData.category_id = formData.category_id;
      if (formData.cost) productData.cost = formData.cost;
      if (formData.stock_quantity !== undefined && formData.stock_quantity !== null) productData.stock_quantity = formData.stock_quantity;
      if (formData.reorder_level !== undefined && formData.reorder_level !== null) productData.reorder_level = formData.reorder_level;
      if (formData.reorder_quantity !== undefined && formData.reorder_quantity !== null) productData.reorder_quantity = formData.reorder_quantity;
      if (formData.max_stock_level !== undefined && formData.max_stock_level !== null) productData.max_stock_level = formData.max_stock_level;
      if (formData.location) productData.location = formData.location;
      
      // Convert uploaded images to base64 and add to product data
      if (imagePreviews.length > 0) {
        productData.images = imagePreviews.map((preview, index) => ({
          url: preview, // base64 data URL
          is_primary: index === 0,
        }));
      }

      console.log('Sending product data:', productData);
      await productsAPI.create(productData);
      navigate('/products');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass rounded-3xl p-6 shadow-xl animate-slide-down">
          <h1 className="text-3xl font-bold gradient-text mb-2">{t.products.addProduct}</h1>
          <p className="text-slate-600 text-sm">{t.products.manageInventory}</p>
        </div>

        {/* Form */}
        <div className="glass rounded-3xl p-8 shadow-xl animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Core Info Section */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {t.common.description}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.products.sku} *</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        required
                        className="input-field"
                        placeholder={language === 'ar' ? 'منتج-001' : 'PRODUCT-001'}
                      />
                      <p className="mt-1 text-xs text-slate-500">{t.products.sku}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSKUScanner(true)}
                      className="px-4 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                      title={language === 'ar' ? 'مسح رمز المنتج بالكاميرا' : 'Scan SKU with camera'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      📷
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.products.barcode}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="input-field flex-1"
                      placeholder="1234567890123"
                    />
                    <button
                      type="button"
                      onClick={() => setShowBarcodeScanner(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                      title={language === 'ar' ? 'مسح الباركود بالكاميرا' : 'Scan barcode with camera'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      📷
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.products.name} *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="input-field"
                    placeholder={language === 'ar' ? 'لابتوب ديل XPS 13' : 'Dell XPS 13 Laptop'}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.common.description}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder={language === 'ar' ? 'وصف مفصل للمنتج...' : 'Detailed product description...'}
                  />
                </div>
              </div>
            </div>

            {/* Classification Section */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                Classification
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.products.brand}</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="input-field"
                    placeholder={language === 'ar' ? 'أبل' : 'Apple'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {t.products.category} {categories.length > 0 && `(${categories.length} available)`}
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">{t.categories.addCategory}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="mt-1 text-xs text-orange-600">
                      {language === 'ar' ? 'لا توجد فئات متاحة. ' : 'No categories available. '}
                      <a href="/categories" className="underline">
                        {language === 'ar' ? 'أنشئ واحدة أولاً' : 'Create one first'}
                      </a>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.products.uom}</label>
                  <select
                    value={formData.uom}
                    onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                    className="input-field"
                  >
                    <option value="unit">{language === 'ar' ? 'وحدة' : 'Unit'}</option>
                    <option value="kg">{language === 'ar' ? 'كيلوغرام (كغ)' : 'Kilogram (kg)'}</option>
                    <option value="lb">{language === 'ar' ? 'رطل (رطل)' : 'Pound (lb)'}</option>
                    <option value="box">{language === 'ar' ? 'صندوق' : 'Box'}</option>
                    <option value="dozen">{language === 'ar' ? 'دزينة' : 'Dozen'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Pricing
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.products.price} *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      required
                      className="input-field pl-8"
                      placeholder="99.99"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.products.cost}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                      className="input-field pl-8"
                      placeholder="50.00"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{t.products.cost}</p>
                </div>
              </div>

              {/* Margin Indicator */}
              {formData.cost > 0 && formData.price > 0 && (
                <div className="mt-4 p-4 glass rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">{t.common.total}:</span>
                    <span className="text-lg font-bold text-green-600">
                      {(((formData.price - formData.cost) / formData.price) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Inventory Section */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                Inventory
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.inventory.stockQuantity}</label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    placeholder="100"
                  />
                  <p className="mt-1 text-xs text-slate-500">{t.inventory.currentStock}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.products.reorderLevel}</label>
                  <input
                    type="number"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    placeholder="20"
                  />
                  <p className="mt-1 text-xs text-slate-500">{t.products.reorderLevel}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.products.reorderQuantity}</label>
                  <input
                    type="number"
                    value={formData.reorder_quantity}
                    onChange={(e) => setFormData({ ...formData, reorder_quantity: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    placeholder="50"
                  />
                  <p className="mt-1 text-xs text-slate-500">{t.products.reorderQuantity}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.products.maxStockLevel}</label>
                  <input
                    type="number"
                    value={formData.max_stock_level}
                    onChange={(e) => setFormData({ ...formData, max_stock_level: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    placeholder="500"
                  />
                  <p className="mt-1 text-xs text-slate-500">{t.products.maxStockLevel}</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.products.location}</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input-field"
                    placeholder={language === 'ar' ? 'مستودع أ، رف 3' : 'Warehouse A, Shelf 3'}
                  />
                  <p className="mt-1 text-xs text-slate-500">{t.products.location}</p>
                </div>
              </div>
            </div>

            {/* Product Images Section */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                Product Images
              </h3>
              
              <div className="space-y-4">
                {/* File Upload */}
                {uploadedImages.length < 5 && (
                  <FileUpload
                    onFileSelect={(file) => {
                      setUploadedImages([...uploadedImages, file]);
                      
                      // Create preview
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImagePreviews([...imagePreviews, reader.result as string]);
                      };
                      reader.readAsDataURL(file);
                    }}
                    accept="image/jpeg,image/png"
                    maxSize={5 * 1024 * 1024}
                    label=""
                    description={language === 'ar' ? 'رفع من الجهاز أو السحب والإفلات' : 'Upload from device or drag & drop'}
                  />
                )}

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-3">
                      {t.products.images} ({imagePreviews.length}/5):
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-slate-200 shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedImages(uploadedImages.filter((_, i) => i !== index));
                              setImagePreviews(imagePreviews.filter((_, i) => i !== index));
                            }}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md shadow-md font-semibold">
                              {t.common.active}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-bounce-in">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm animate-bounce-in">
                {success}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={isLoading}
                className={`btn-primary flex-1 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {language === 'ar' ? 'جاري الإنشاء...' : 'Creating...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t.products.addProduct}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="btn-secondary px-8"
              >
                {t.common.cancel}
              </button>
            </div>
          </form>
        </div>

        {/* Barcode Scanner Modal */}
        {showBarcodeScanner && (
          <BarcodeScanner
            onScan={handleBarcodeScanned}
            onClose={() => setShowBarcodeScanner(false)}
            title={t.ocr.ocrScanner}
            instructions={t.ocr.uploadDocument}
          />
        )}

        {/* SKU Scanner Modal */}
        {showSKUScanner && (
          <BarcodeScanner
            onScan={handleSKUScanned}
            onClose={() => setShowSKUScanner(false)}
            title={t.products.sku}
            instructions={t.products.sku}
          />
        )}
      </div>
    </Layout>
  );
};

