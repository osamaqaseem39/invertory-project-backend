import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useTranslation } from '../i18n/i18nContext';
import { printSettingsAPI, PrintSettings } from '../api/print-settings';

export const PrintSettingsPage = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<PrintSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await printSettingsAPI.getPrintSettings();
      setSettings(data);
    } catch (err: any) {
      setError('Failed to load print settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      await printSettingsAPI.updatePrintSettings(settings.id, settings);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-600">{t.common.loading}</div>
        </div>
      </Layout>
    );
  }

  if (!settings) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          No print settings found. Please contact administrator.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t.printSettingsConfig.printSettings}</h1>
          <p className="text-gray-600 mt-2">Configure receipt printing and business information</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-md space-y-8">
          {/* Business Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {t.printSettingsConfig.businessInformation}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.printSettingsConfig.businessName} *</label>
                <input
                  type="text"
                  value={settings.business_name}
                  onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Business Name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.printSettingsConfig.businessPhone}</label>
                <input
                  type="text"
                  value={settings.business_phone || ''}
                  onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.printSettingsConfig.businessEmail}</label>
                <input
                  type="email"
                  value={settings.business_email || ''}
                  onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="info@yourbusiness.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.printSettingsConfig.taxId}</label>
                <input
                  type="text"
                  value={settings.tax_id || ''}
                  onChange={(e) => setSettings({ ...settings, tax_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="TAX-123456789"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.printSettingsConfig.businessAddress}</label>
                <textarea
                  value={settings.business_address || ''}
                  onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Main Street&#10;City, State 12345"
                />
              </div>
            </div>
          </div>

          {/* Receipt Content */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t.printSettingsConfig.receiptContent}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.printSettingsConfig.headerText}</label>
                <textarea
                  value={settings.header_text || ''}
                  onChange={(e) => setSettings({ ...settings, header_text: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Thank you for shopping with us!"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.printSettingsConfig.footerText}</label>
                <textarea
                  value={settings.footer_text || ''}
                  onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Please visit again!"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.printSettingsConfig.returnPolicy}</label>
                <textarea
                  value={settings.return_policy || ''}
                  onChange={(e) => setSettings({ ...settings, return_policy: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Returns accepted within 30 days with receipt."
                />
              </div>
            </div>
          </div>

          {/* Print Options */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t.printSettingsConfig.printOptions}
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.print_qr_code}
                  onChange={(e) => setSettings({ ...settings, print_qr_code: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">{t.printSettingsConfig.printQrCode}</div>
                  <div className="text-xs text-gray-500">Enables customers to access digital receipt</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.print_barcode}
                  onChange={(e) => setSettings({ ...settings, print_barcode: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">{t.printSettingsConfig.printBarcode}</div>
                  <div className="text-xs text-gray-500">Print transaction number as barcode</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.show_tax_breakdown}
                  onChange={(e) => setSettings({ ...settings, show_tax_breakdown: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">{t.printSettingsConfig.showTaxBreakdown}</div>
                  <div className="text-xs text-gray-500">Display detailed tax information</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.show_cashier_name}
                  onChange={(e) => setSettings({ ...settings, show_cashier_name: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">{t.printSettingsConfig.showCashierName}</div>
                  <div className="text-xs text-gray-500">Display cashier name on receipt</div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.show_customer_info}
                  onChange={(e) => setSettings({ ...settings, show_customer_info: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">{t.printSettingsConfig.showCustomerInfo}</div>
                  <div className="text-xs text-gray-500">Display customer name if available</div>
                </div>
              </label>
            </div>
          </div>

          {/* Paper Settings */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{t.printSettingsConfig.paperSettings}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.printSettingsConfig.paperWidth}</label>
                <select
                  value={settings.paper_width}
                  onChange={(e) => setSettings({ ...settings, paper_width: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={58}>58mm</option>
                  <option value={80}>80mm (Standard)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.printSettingsConfig.fontSize}</label>
                <input
                  type="number"
                  value={settings.font_size}
                  onChange={(e) => setSettings({ ...settings, font_size: parseInt(e.target.value) || 12 })}
                  min={8}
                  max={16}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t.common.save}
                </>
              )}
            </button>
            <button
              onClick={loadSettings}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              {t.printSettingsConfig.reset}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

