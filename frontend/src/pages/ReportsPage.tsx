import { useState } from 'react';
import { Layout } from '../components/Layout';
import { useTranslation } from '../i18n/i18nContext';
import { professionalPOSAPI } from '../api/professional-pos';

export const ReportsPage = () => {
  const { t } = useTranslation();
  const [reportType, setReportType] = useState<'z' | 'x' | 'top-items' | 'sales-by-hour'>('z');
  const [sessionId, setSessionId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState('');

  const generateReport = async () => {
    if (reportType === 'z' || reportType === 'x') {
      if (!sessionId.trim()) {
        setError('Please enter session ID');
        return;
      }
    }

    setIsLoading(true);
    setError('');
    setReportData(null);

    try {
      let data;
      if (reportType === 'z') {
        data = await professionalPOSAPI.cashManagement.generateZReport(sessionId);
      } else if (reportType === 'x') {
        data = await professionalPOSAPI.cashManagement.generateXReport(sessionId);
      } else if (reportType === 'top-items') {
        data = await professionalPOSAPI.reports.getTopItems({
          date_from: `${dateFrom}T00:00:00Z`,
          date_to: `${dateTo}T23:59:59Z`,
          limit: 20,
        });
      } else if (reportType === 'sales-by-hour') {
        data = await professionalPOSAPI.reports.getSalesByHour(dateFrom);
      }

      setReportData(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t.reports.title}</h1>
          <p className="text-gray-600 mt-2">Generate various sales and operational reports</p>
        </div>

        {/* Report Type Selector */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.reports.reportType}
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="z">{t.reports.zReport}</option>
                <option value="x">{t.reports.xReport}</option>
                <option value="top-items">{t.reports.topItems}</option>
                <option value="sales-by-hour">{t.reports.salesByHour}</option>
              </select>
            </div>

            {/* Session ID for Z/X Reports */}
            {(reportType === 'z' || reportType === 'x') && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t.reports.sessionId}
                </label>
                <input
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Enter POS session ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Date Range for Other Reports */}
            {(reportType === 'top-items' || reportType === 'sales-by-hour') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.analytics.from}
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            <button
              onClick={generateReport}
              disabled={isLoading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
            >
              {isLoading ? t.common.loading : t.reports.generateReport}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Report Display */}
        {reportData && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{t.reports.reportResults}</h3>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(reportData, null, 2)}
            </pre>
            
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                {t.reports.printReport}
              </button>
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(reportData, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `report-${reportType}-${Date.now()}.json`;
                  link.click();
                }}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                {t.reports.exportJson}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

