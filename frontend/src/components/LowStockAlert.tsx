import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { inventoryAPI } from '../api/inventory';

export const LowStockAlert = () => {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLowStock();
  }, []);

  const loadLowStock = async () => {
    try {
      const products = await inventoryAPI.getLowStockProducts();
      setLowStockProducts(products);
    } catch (err) {
      console.error('Failed to load low stock products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Low Stock Alerts</h3>
            <p className="text-sm text-slate-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (lowStockProducts.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Stock Levels</h3>
            <p className="text-sm text-green-600 font-semibold">✓ All products above reorder level</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Low Stock Alerts</h3>
            <p className="text-sm text-yellow-600 font-semibold">⚠️ {lowStockProducts.length} product(s) need attention</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {lowStockProducts.slice(0, 5).map((product, index) => (
          <Link
            key={product.id}
            to={`/products/${product.id}`}
            className="block p-3 glass rounded-lg hover:bg-yellow-50/50 transition-all animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
          >
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="font-semibold text-slate-800 text-sm">{product.name}</div>
                <div className="text-xs text-slate-500">SKU: {product.sku}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-red-600">{product.stock_quantity}</div>
                <div className="text-xs text-slate-500">Reorder at: {product.reorder_level}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {lowStockProducts.length > 5 && (
        <Link
          to="/products?low_stock=true"
          className="block mt-3 text-center text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors"
        >
          View all {lowStockProducts.length} low stock products →
        </Link>
      )}
    </div>
  );
};





