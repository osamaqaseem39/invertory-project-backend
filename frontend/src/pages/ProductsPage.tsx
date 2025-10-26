import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../i18n/i18nContext';
import { Product } from '../types';
import { productsAPI } from '../api/products';
import { getProductName, getProductBrand, formatCurrency } from '../utils/localization';

export const ProductsPage = () => {
  const { user } = useAuthStore();
  const { t, language } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
  }, [searchQuery, filterCategory, filterBrand, showArchived]);

  const loadProducts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: any = {};
      if (searchQuery) params.q = searchQuery;
      if (filterCategory) params.category = filterCategory;
      if (filterBrand) params.brand = filterBrand;
      if (showArchived) params.is_archived = true;

      const response = await productsAPI.list(params);
      setProducts(response.data);

      // Extract unique categories and brands
      const uniqueCategories = Array.from(new Set(response.data.map(p => p.category).filter(Boolean)));
      const uniqueBrands = Array.from(new Set(response.data.map(p => p.brand).filter(Boolean)));
      setCategories(uniqueCategories as string[]);
      setBrands(uniqueBrands as string[]);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async (product: Product) => {
    const productName = getProductName(product, language);
    if (!window.confirm(`Archive "${productName}"?\n\nThis will hide it from the active catalog.`)) {
      return;
    }

    try {
      const response = await productsAPI.archive(product.id);
      alert(`✅ ${response.message}`);
      refreshProducts();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || 'Failed to archive product';
      alert(`❌ Error: ${errorMsg}`);
      console.error('Archive error:', err);
    }
  };

  const handleRestore = async (product: Product) => {
    const productName = getProductName(product, language);
    if (!window.confirm(`Restore "${productName}"?\n\nThis will make it available in the active catalog again.`)) {
      return;
    }

    try {
      const response = await productsAPI.restore(product.id);
      alert(`✅ ${response.message}`);
      refreshProducts();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || 'Failed to restore product';
      alert(`❌ Error: ${errorMsg}`);
      console.error('Restore error:', err);
    }
  };

  const canCreateProduct = ['owner_ultimate_super_admin', 'admin', 'inventory_manager'].includes(user?.role || '');
  const canEditProduct = ['owner_ultimate_super_admin', 'admin', 'inventory_manager'].includes(user?.role || '');
  const canArchiveProduct = ['owner_ultimate_super_admin', 'admin'].includes(user?.role || '');

  const formatPrice = (price: number): string => {
    return formatCurrency(price, language);
  };

  // Reload products after operations
  const refreshProducts = () => {
    loadProducts();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="glass rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-down">
          <div>
            <h1 className="text-3xl font-bold gradient-text">{t.products.products}</h1>
            <p className="text-slate-600 text-sm mt-1">{showArchived ? t.products.archived : t.products.browseProducts}</p>
          </div>
          <div className="flex gap-3">
            {canCreateProduct && (
              <Link
                to="/products/new"
                className="btn-primary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </Link>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="glass rounded-2xl p-6 shadow-lg animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
                placeholder="Search by name, SKU, brand, description, barcode, location, unit, or category..."
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input-field"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Brand</label>
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="input-field"
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Show Archived Toggle */}
          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="showArchived"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
            />
            <label htmlFor="showArchived" className="text-sm font-medium text-slate-700 cursor-pointer">
              Show archived products
            </label>
          </div>
        </div>

        {/* Products Grid */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          {isLoading ? (
            <div className="glass rounded-3xl p-12 text-center shadow-xl">
              <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-600">Loading products...</p>
            </div>
          ) : error ? (
            <div className="glass rounded-3xl p-8 text-center shadow-xl">
              <div className="inline-block w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center shadow-xl">
              <div className="inline-block w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-slate-600">No products found</p>
              {canCreateProduct && (
                <Link to="/products/new" className="btn-primary inline-flex items-center gap-2 mt-4">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create First Product
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, idx) => (
                <div
                  key={product.id}
                  className="glass rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 animate-fade-in"
                  style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}
                >
                  {/* Product Image - Clickable */}
                  <Link to={`/products/${product.id}`} className="block relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden group">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].url}
                        alt={getProductName(product, language)}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {/* Status Badges */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {product.is_archived && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-lg shadow-lg">
                          Archived
                        </span>
                      )}
                      {!product.is_active && !product.is_archived && (
                        <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-lg shadow-lg">
                          Inactive
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="p-4">
                    <Link to={`/products/${product.id}`} className="block">
                      <div className="text-lg font-bold text-slate-800 mb-1 truncate hover:text-primary-600 transition-colors">
                        {getProductName(product, language)}
                      </div>
                    </Link>
                    <div className="text-sm text-slate-500 mb-2">SKU: {product.sku}</div>
                    
                    {/* Brand & Category */}
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {product.brand && (
                        <span className="px-2 py-1 bg-accent-100 text-accent-700 text-xs font-semibold rounded-lg">
                          {getProductBrand(product, language)}
                        </span>
                      )}
                      {product.category && (
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-lg">
                          {product.category}
                        </span>
                      )}
                    </div>

                    {/* Stock Status */}
                    <div className="flex items-center justify-between mb-2 glass rounded-lg p-2">
                      <span className={`text-xs font-bold ${
                        product.stock_quantity === 0 ? 'text-red-600' :
                        product.stock_quantity <= product.reorder_level ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {product.stock_quantity === 0 ? '⚠️ OUT OF STOCK' :
                         product.stock_quantity <= product.reorder_level ? '⚡ LOW STOCK' :
                         '✓ IN STOCK'}
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {product.stock_quantity} {product.uom}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="text-2xl font-bold text-primary-600 mb-3">
                      {formatPrice(Number(product.price))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-slate-200">
                      <Link
                        to={`/products/${product.id}`}
                        className="flex-1 px-3 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm font-semibold hover:bg-primary-200 transition-colors text-center"
                      >
                        View
                      </Link>
                      {canEditProduct && !product.is_archived && (
                        <Link
                          to={`/products/${product.id}`}
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors"
                        >
                          Edit
                        </Link>
                      )}
                      {canArchiveProduct && !product.is_archived && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleArchive(product); }}
                          className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-semibold hover:bg-orange-200 transition-colors"
                        >
                          Archive
                        </button>
                      )}
                      {canArchiveProduct && product.is_archived && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRestore(product); }}
                          className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-200 transition-colors"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

