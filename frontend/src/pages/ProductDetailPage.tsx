import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { Product } from '../types';
import { productsAPI } from '../api/products';

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    sku: '',
    barcode: '',
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
    is_active: true,
  });

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await productsAPI.getById(id!);
      setProduct(data);
      
      // Initialize edit form
      setEditForm({
        name: data.name,
        sku: data.sku,
        barcode: data.barcode || '',
        description: data.description || '',
        brand: data.brand || '',
        category_id: data.category_id || '',
        stock_quantity: data.stock_quantity || 0,
        reorder_level: data.reorder_level || 0,
        reorder_quantity: data.reorder_quantity || 0,
        max_stock_level: data.max_stock_level || 0,
        location: '',
        price: Number(data.price),
        cost: Number(data.cost) || 0,
        uom: data.uom,
        is_active: data.is_active,
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!product) return;
    
    setIsSaving(true);
    try {
      const updateData: any = {
        name: editForm.name,
        sku: editForm.sku,
        description: editForm.description || null,
        brand: editForm.brand || null,
        category_id: editForm.category_id || null,
        price: editForm.price,
        uom: editForm.uom,
        is_active: editForm.is_active,
      };

      if (editForm.barcode) {
        updateData.barcode = editForm.barcode;
      }

      if (editForm.cost > 0) {
        updateData.cost = editForm.cost;
      }

      const response = await productsAPI.update(product.id, updateData);
      alert(`✅ ${response.message}`);
      setIsEditMode(false);
      loadProduct(); // Reload to show updated data
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || 'Failed to update product';
      alert(`❌ Error: ${errorMsg}`);
      console.error('Update error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!product) return;
    if (!window.confirm(`Archive "${product.name}"?`)) return;

    try {
      await productsAPI.archive(product.id);
      alert('✅ Product archived successfully');
      navigate('/products');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to archive product');
    }
  };

  const canEdit = ['owner_ultimate_super_admin', 'admin', 'inventory_manager'].includes(user?.role || '');
  const canArchive = ['owner_ultimate_super_admin', 'admin'].includes(user?.role || '');

  const formatPrice = (price: number): string => {
    return `$${Number(price).toFixed(2)}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600 font-medium">Loading product...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="glass rounded-3xl p-12 text-center shadow-xl max-w-2xl mx-auto">
          <div className="inline-block w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-red-600 font-semibold mb-4">{error || 'Product not found'}</p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Products
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-down">
          <div>
            <Link to="/products" className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center gap-1 mb-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Products
            </Link>
            <h1 className="text-3xl font-bold gradient-text">{isEditMode ? 'Edit Product' : product.name}</h1>
            <p className="text-slate-600 text-sm mt-1">SKU: {product.sku}</p>
          </div>
          <div className="flex gap-3">
            {canEdit && !product.is_archived && !isEditMode && (
              <button onClick={() => setIsEditMode(true)} className="btn-primary flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Product
              </button>
            )}
            {isEditMode && (
              <>
                <button onClick={handleSave} disabled={isSaving} className={`btn-primary flex items-center gap-2 ${isSaving ? 'opacity-75' : ''}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => { setIsEditMode(false); setEditForm({ name: product.name, sku: product.sku, barcode: product.barcode || '', description: product.description || '', brand: product.brand || '', category_id: product.category_id || '', stock_quantity: product.stock_quantity || 0, reorder_level: product.reorder_level || 0, reorder_quantity: product.reorder_quantity || 0, max_stock_level: product.max_stock_level || 0, location: '', price: Number(product.price), cost: Number(product.cost) || 0, uom: product.uom, is_active: product.is_active }); }} className="btn-secondary">
                  Cancel
                </button>
              </>
            )}
            {canArchive && !product.is_archived && !isEditMode && (
              <button onClick={handleArchive} className="btn-secondary flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Archive
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Images */}
          <div className="lg:col-span-1">
            <div className="glass rounded-3xl p-6 shadow-xl animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
              <h3 className="text-lg font-bold text-slate-800 mb-4">Product Images</h3>
              {product.images && product.images.length > 0 ? (
                <div className="space-y-4">
                  <img
                    src={product.images.find(img => img.is_primary)?.url || product.images[0].url}
                    alt={product.name}
                    className="w-full h-64 object-cover rounded-2xl shadow-lg"
                  />
                  {product.images.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {product.images.slice(0, 3).map((img) => (
                        <img
                          key={img.id}
                          src={img.url}
                          alt={product.name}
                          className="w-full h-20 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform border-2 border-transparent hover:border-primary-400"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                  <svg className="w-24 h-24 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="glass rounded-3xl p-8 shadow-xl animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Product Information</h2>
              
              {isEditMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Product Name *</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">SKU *</label>
                      <input
                        type="text"
                        value={editForm.sku}
                        onChange={(e) => setEditForm({...editForm, sku: e.target.value})}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Barcode</label>
                      <input
                        type="text"
                        value={editForm.barcode}
                        onChange={(e) => setEditForm({...editForm, barcode: e.target.value})}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Brand</label>
                      <input
                        type="text"
                        value={editForm.brand}
                        onChange={(e) => setEditForm({...editForm, brand: e.target.value})}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Category ID</label>
                      <input
                        type="text"
                        value={editForm.category_id}
                        onChange={(e) => setEditForm({...editForm, category_id: e.target.value})}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Unit of Measure</label>
                      <select
                        value={editForm.uom}
                        onChange={(e) => setEditForm({...editForm, uom: e.target.value})}
                        className="input-field"
                      >
                        <option value="unit">Unit</option>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="lb">Pound (lb)</option>
                        <option value="box">Box</option>
                        <option value="dozen">Dozen</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      className="input-field"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-semibold text-slate-700 cursor-pointer">
                      Product is active
                    </label>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-semibold text-slate-600 mb-2">SKU</div>
                    <div className="text-slate-800 font-mono bg-slate-100 px-4 py-2 rounded-lg">{product.sku}</div>
                  </div>

                  {product.barcode && (
                    <div>
                      <div className="text-sm font-semibold text-slate-600 mb-2">Barcode</div>
                      <div className="text-slate-800 font-mono bg-slate-100 px-4 py-2 rounded-lg">{product.barcode}</div>
                    </div>
                  )}

                  {product.brand && (
                    <div>
                      <div className="text-sm font-semibold text-slate-600 mb-2">Brand</div>
                      <div className="text-slate-800">
                        <span className="inline-block px-4 py-2 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold rounded-lg shadow-lg">
                          {product.brand}
                        </span>
                      </div>
                    </div>
                  )}

                  {product.category && (
                    <div>
                      <div className="text-sm font-semibold text-slate-600 mb-2">Category</div>
                      <div className="text-slate-800">
                        <span className="inline-block px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-lg shadow-lg">
                          {product.category}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-semibold text-slate-600 mb-2">Unit of Measure</div>
                    <div className="text-slate-800 bg-slate-100 px-4 py-2 rounded-lg">{product.uom}</div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-slate-600 mb-2">Status</div>
                    <div>
                      {product.is_archived ? (
                        <span className="inline-block px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg">
                          🗄️ Archived
                        </span>
                      ) : product.is_active ? (
                        <span className="inline-block px-4 py-2 bg-green-100 text-green-700 font-semibold rounded-lg">
                          ✓ Active
                        </span>
                      ) : (
                        <span className="inline-block px-4 py-2 bg-yellow-100 text-yellow-700 font-semibold rounded-lg">
                          ⚠ Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!isEditMode && product.description && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="text-sm font-semibold text-slate-600 mb-2">Description</div>
                  <div className="text-slate-700 leading-relaxed">{product.description}</div>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="glass rounded-3xl p-8 shadow-xl animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Pricing</h2>
              
              {isEditMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Selling Price *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.price}
                          onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value) || 0})}
                          className="input-field pl-8"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Cost Price</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.cost}
                          onChange={(e) => setEditForm({...editForm, cost: parseFloat(e.target.value) || 0})}
                          className="input-field pl-8"
                        />
                      </div>
                    </div>
                  </div>

                  {editForm.cost > 0 && editForm.price > 0 && (
                    <div className="p-4 glass rounded-xl">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">Profit Margin:</span>
                        <span className="text-lg font-bold text-green-600">
                          {(((editForm.price - editForm.cost) / editForm.price) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl border-2 border-primary-200">
                    <div className="text-sm font-semibold text-slate-600 mb-2">Selling Price</div>
                    <div className="text-4xl font-bold text-primary-600">{formatPrice(Number(product.price))}</div>
                    <div className="text-xs text-slate-500 mt-1">per {product.uom}</div>
                  </div>

                  {product.cost && (
                    <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-slate-200">
                      <div className="text-sm font-semibold text-slate-600 mb-2">Cost Price</div>
                      <div className="text-4xl font-bold text-slate-700">{formatPrice(Number(product.cost))}</div>
                      <div className="text-xs text-green-600 mt-1 font-semibold">
                        Margin: {(((Number(product.price) - Number(product.cost)) / Number(product.price)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Metadata */}
            {!isEditMode && (
              <div className="glass rounded-3xl p-8 shadow-xl animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Metadata</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-600 mb-1">Created By</div>
                    <div className="text-slate-800">{product.created_by?.display_name || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{formatDate(product.created_at)}</div>
                  </div>

                  {product.updated_by && (
                    <div>
                      <div className="text-sm font-semibold text-slate-600 mb-1">Last Updated By</div>
                      <div className="text-slate-800">{product.updated_by.display_name}</div>
                      <div className="text-xs text-slate-500">{formatDate(product.updated_at)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
