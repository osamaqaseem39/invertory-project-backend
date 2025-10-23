import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { UserRole, UserStatistics, AuditLog, ProductStatistics } from '../types';
import { usersAPI } from '../api/users';
import { productsAPI } from '../api/products';
import { LowStockAlert } from '../components/LowStockAlert';
import apiClient from '../api/client';
import { useTranslation } from '../i18n/i18nContext';

export const DashboardPage = () => {
  const { user, permissions } = useAuthStore();
  const { t } = useTranslation();
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [productStats, setProductStats] = useState<ProductStatistics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load user statistics if permitted
      if (permissions?.can_list_users) {
        const userStats = await usersAPI.getStatistics();
        setStats(userStats);
      }

      // Load product statistics (all roles can see products)
      const prodStats = await productsAPI.getStatistics();
      setProductStats(prodStats);

      // Load audit logs if permitted
      if (permissions?.can_view_audit_logs) {
        const auditResponse = await apiClient.get('/audit?limit=10');
        setAuditLogs(auditResponse.data.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const formatPrice = (price: number): string => {
    return `$${Number(price).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600 font-medium">{t.common.loading}</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Owner/Admin Dashboard
  if (user?.role === UserRole.OWNER_ULTIMATE_SUPER_ADMIN || user?.role === UserRole.ADMIN) {
    return (
      <Layout>
        <div className="space-y-8">
          {/* Welcome Header */}
          <div className="glass rounded-3xl p-8 shadow-xl animate-slide-down">
            <h1 className="text-4xl font-bold gradient-text text-shadow-lg mb-2">
              {t.dashboard.welcome} {user.display_name}! 👋
            </h1>
            <p className="text-slate-600">{t.dashboard.systemToday}</p>
          </div>

          {/* User Statistics */}
          {stats && (
            <>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {t.dashboard.userManagement}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="stat-card animate-slide-up group" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-slate-800 mb-1">{stats.totalUsers}</div>
                  <div className="text-sm text-slate-600 font-medium">{t.dashboard.totalUsers}</div>
                </div>

                <div className="stat-card animate-slide-up group" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-1">{stats.activeUsers}</div>
                  <div className="text-sm text-slate-600 font-medium">Active Users</div>
                </div>

                <div className="stat-card animate-slide-up group" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-red-600 mb-1">{stats.totalUsers - stats.activeUsers}</div>
                  <div className="text-sm text-slate-600 font-medium">Inactive Users</div>
                </div>
              </div>
            </>
          )}

          {/* Product Statistics */}
          {productStats && (
            <>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mt-8">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Product Catalog
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="stat-card animate-slide-up group" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-slate-800 mb-1">{productStats.totalProducts}</div>
                  <div className="text-sm text-slate-600 font-medium">Total Products</div>
                </div>

                <div className="stat-card animate-slide-up group" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-1">{productStats.activeProducts}</div>
                  <div className="text-sm text-slate-600 font-medium">Active Products</div>
                </div>

                <div className="stat-card animate-slide-up group" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-orange-600 mb-1">{productStats.archivedProducts}</div>
                  <div className="text-sm text-slate-600 font-medium">Archived Products</div>
                </div>
              </div>
            </>
          )}

          {/* Top Categories & Brands */}
          {productStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-3xl p-8 shadow-xl animate-slide-up" style={{ animationDelay: '0.7s', animationFillMode: 'both' }}>
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Top Categories
                </h3>
                <div className="space-y-3">
                  {productStats.productsByCategory.slice(0,5).map((cat) => (
                    <div key={cat.category} className="flex justify-between items-center p-3 glass rounded-xl hover:scale-105 transition-transform">
                      <span className="font-medium text-slate-700">{cat.category}</span>
                      <span className="px-3 py-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold text-sm rounded-lg">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-3xl p-8 shadow-xl animate-slide-up" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Top Brands
                </h3>
                <div className="space-y-3">
                  {productStats.productsByBrand.slice(0,5).map((brand) => (
                    <div key={brand.brand} className="flex justify-between items-center p-3 glass rounded-xl hover:scale-105 transition-transform">
                      <span className="font-medium text-slate-700">{brand.brand}</span>
                      <span className="px-3 py-1 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold text-sm rounded-lg">{brand.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Products */}
          {productStats && productStats.recentProducts.length > 0 && (
            <div className="glass rounded-3xl p-8 shadow-xl animate-slide-up" style={{ animationDelay: '0.9s', animationFillMode: 'both' }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Recently Added Products</h2>
                <Link to="/products" className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center gap-1">
                  View All
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {productStats.recentProducts.slice(0, 4).map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="glass rounded-2xl p-4 hover:scale-105 transition-all duration-300 group"
                  >
                    {product.images && product.images.length > 0 && (
                      <img 
                        src={product.images[0].url} 
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-lg mb-3 group-hover:shadow-lg transition-shadow"
                      />
                    )}
                    <div className="font-semibold text-slate-800 text-sm mb-1 truncate">{product.name}</div>
                    <div className="text-primary-600 font-bold text-lg">{formatPrice(Number(product.price))}</div>
                    <div className="text-xs text-slate-500 mt-1">{product.brand}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Audit Logs (Owner only) */}
          {/* Low Stock Alerts */}
          <div className="animate-slide-up" style={{ animationDelay: '0.9s', animationFillMode: 'both' }}>
            <LowStockAlert />
          </div>

          {user?.role === UserRole.OWNER_ULTIMATE_SUPER_ADMIN && auditLogs.length > 0 && (
            <div className="glass rounded-3xl p-8 shadow-xl animate-slide-up" style={{ animationDelay: '1.0s', animationFillMode: 'both' }}>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Recent Activity</h2>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Action</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actor</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Target</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, index) => (
                      <tr key={log.id} className="border-t border-slate-100 hover:bg-primary-50/50 transition-colors" style={{ animationDelay: `${1.1 + index * 0.05}s` }}>
                        <td className="px-4 py-3">
                          <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold rounded-lg">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{log.actor.username}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{log.target?.username || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{formatDate(log.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Inventory Manager Dashboard
  if (user?.role === UserRole.INVENTORY_MANAGER) {
    return (
      <Layout>
        <div className="space-y-8">
          <div className="glass rounded-3xl p-8 shadow-xl text-center animate-scale-in">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce-gentle">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-4">
              Inventory Manager Dashboard
            </h1>
            <p className="text-slate-600 mb-8">Manage and track product catalog</p>
          </div>

          {/* Low Stock Alerts - Priority for Inventory Manager */}
          <div className="animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            <LowStockAlert />
          </div>

          {/* Product Stats for Inventory Manager */}
          {productStats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="stat-card group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">{productStats.totalProducts}</div>
                <div className="text-sm text-slate-600 font-medium">Total Products</div>
              </div>

              <div className="stat-card group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-1">{productStats.activeProducts}</div>
                <div className="text-sm text-slate-600 font-medium">Active</div>
              </div>

              <div className="stat-card group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-gray-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-600 mb-1">{productStats.archivedProducts}</div>
                <div className="text-sm text-slate-600 font-medium">Archived</div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="glass rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/products" className="btn-primary text-center">
                <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                View Products
              </Link>
              <Link to="/products/new" className="btn-secondary text-center">
                <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Product
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Cashier Dashboard
  if (user?.role === UserRole.CASHIER) {
    return (
      <Layout>
        <div className="space-y-8">
          <div className="glass rounded-3xl p-8 shadow-xl text-center animate-scale-in">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce-gentle">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-4">
              Cashier Dashboard
            </h1>
            <p className="text-slate-600 mb-8">Quick access to product catalog</p>
          </div>

          {/* Low Stock Info for Cashier (read-only) */}
          <div className="animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            <LowStockAlert />
          </div>

          {/* Product Stats for Cashier */}
          {productStats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="stat-card group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-1">{productStats.activeProducts}</div>
                <div className="text-sm text-slate-600 font-medium">Available Products</div>
              </div>

              <Link to="/products" className="stat-card group cursor-pointer hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-lg font-bold text-slate-800 mb-1">Browse Catalog</div>
                <div className="text-sm text-slate-600 font-medium">Search products</div>
              </Link>
            </div>
          )}

          {/* Recent Products for Cashier */}
          {productStats && productStats.recentProducts.length > 0 && (
            <div className="glass rounded-3xl p-8 shadow-xl">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Quick Access Products</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {productStats.recentProducts.slice(0, 4).map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="glass rounded-2xl p-4 hover:scale-105 transition-all duration-300 group"
                  >
                    {product.images && product.images.length > 0 && (
                      <img 
                        src={product.images[0].url} 
                        alt={product.name}
                        className="w-full h-24 object-cover rounded-lg mb-2"
                      />
                    )}
                    <div className="font-semibold text-slate-800 text-xs mb-1 truncate">{product.name}</div>
                    <div className="text-primary-600 font-bold">{formatPrice(Number(product.price))}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Guest Dashboard
  return (
    <Layout>
      <div className="space-y-8">
        <div className="glass rounded-3xl p-12 shadow-2xl text-center max-w-2xl mx-auto animate-scale-in">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center mb-6 shadow-lg animate-float">
            <span className="text-5xl">👤</span>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Welcome, {user?.display_name}!
          </h1>
          <p className="text-slate-600 mb-8 text-lg">You have view-only access to the system</p>

          <div className="glass rounded-2xl p-8 inline-block mb-8">
            <div className="mb-4 text-sm font-semibold text-slate-600">Your ID</div>
            <div className="text-slate-800 font-mono text-lg mb-6">{user?.id}</div>
            <div className="mb-4 text-sm font-semibold text-slate-600">Display Name</div>
            <div className="text-2xl font-bold text-slate-800">{user?.display_name}</div>
          </div>

          {/* Guest can browse products */}
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse Product Catalog
          </Link>
        </div>
      </div>
    </Layout>
  );
};
