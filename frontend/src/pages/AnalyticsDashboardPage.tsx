import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useTranslation } from '../i18n/i18nContext';
import { analyticsAPI, SalesAnalytics } from '../api/analytics';
import { format, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const AnalyticsDashboardPage = () => {
  const { t } = useTranslation();
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await analyticsAPI.getSalesAnalytics(
        `${dateFrom}T00:00:00Z`,
        `${dateTo}T23:59:59Z`
      );
      setAnalytics(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = () => {
    loadAnalytics();
  };

  if (isLoading && !analytics) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-600">{t.common.loading}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t.analytics.title}</h1>
          <p className="text-gray-600 mt-2">{t.analytics.salesOverview}</p>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.analytics.from}
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.analytics.to}
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
            >
              {isLoading ? t.common.loading : t.analytics.generate}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {analytics && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                <div className="text-sm opacity-90">{t.common.total} {t.nav.sales}</div>
                <div className="text-3xl font-bold mt-2">${analytics.overview.total_sales.toFixed(2)}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
                <div className="text-sm opacity-90">{t.analytics.totalTransactions}</div>
                <div className="text-3xl font-bold mt-2">{analytics.overview.total_transactions}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                <div className="text-sm opacity-90">{t.analytics.averageTransaction}</div>
                <div className="text-3xl font-bold mt-2">${analytics.overview.average_transaction.toFixed(2)}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
                <div className="text-sm opacity-90">{t.analytics.uniqueCustomers}</div>
                <div className="text-3xl font-bold mt-2">{analytics.overview.unique_customers}</div>
              </div>
            </div>

            {/* Hourly Sales Chart */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">{t.analytics.trends} - {t.analytics.hourlySales}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.hourly_distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" label={{ value: 'Hour', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Sales ($)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} name="Sales" />
                  <Line type="monotone" dataKey="transactions" stroke="#82ca9d" strokeWidth={2} name="Transactions" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Payment Methods & Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{t.analytics.paymentMethods}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics.payment_methods).map(([method, data]) => ({
                        name: method,
                        value: data.total,
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.keys(analytics.payment_methods).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{t.analytics.trends} {t.analytics.summary}</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <div className="text-sm text-gray-600">{t.analytics.bestDay}</div>
                    <div className="font-bold text-lg">{analytics.trends.best_day.date}</div>
                    <div className="text-green-600 text-xl font-semibold">${analytics.trends.best_day.sales.toFixed(2)}</div>
                  </div>
                  <div className="border-l-4 border-red-500 pl-4">
                    <div className="text-sm text-gray-600">{t.analytics.worstDay}</div>
                    <div className="font-bold text-lg">{analytics.trends.worst_day.date}</div>
                    <div className="text-red-600 text-xl font-semibold">${analytics.trends.worst_day.sales.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">{t.analytics.topProducts}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">SKU</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Qty Sold</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Revenue</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analytics.top_products.slice(0, 10).map((product, index) => (
                      <tr key={product.product_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium">{product.product_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{product.sku}</td>
                        <td className="px-4 py-3 text-sm text-right">{product.quantity_sold}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">${product.revenue.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right text-green-600">${(product.profit || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cashier Performance */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">{t.analytics.cashierPerformance}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.cashier_performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cashier_name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="total_sales" fill="#8884d8" name="Total Sales" />
                  <Bar dataKey="transactions_count" fill="#82ca9d" name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

