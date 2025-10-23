import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/i18nContext';
import licensingAPI, { License, LicenseGenerationRequest } from '../api/licensing';

const LicenseManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const token = localStorage.getItem('access_token');

  const [licenses, setLicenses] = useState<License[]>([]);
  const [trials, setTrials] = useState<any[]>([]);
  const [suspicious, setSuspicious] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'licenses' | 'trials' | 'suspicious'>('licenses');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState<LicenseGenerationRequest>({
    customerEmail: '',
    customerName: '',
    companyName: '',
    licenseType: 'PROFESSIONAL',
    maxActivations: 1,
    purchaseAmount: 299.99,
    currency: 'USD',
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    if (!token) return;

    try {
      setLoading(true);

      if (activeTab === 'licenses') {
        const data = await licensingAPI.listLicenses(token);
        setLicenses(data);
      } else if (activeTab === 'trials') {
        const data = await licensingAPI.listTrials(token);
        setTrials(data);
      } else if (activeTab === 'suspicious') {
        const data = await licensingAPI.getSuspiciousActivities(token);
        setSuspicious(data);
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLicense = async () => {
    if (!token) return;

    try {
      const license = await licensingAPI.generateLicense(token, formData);
      
      alert(`License generated!\n\nKey: ${license.license_key}\n\nSend this to customer via email.`);
      
      setShowGenerateModal(false);
      setFormData({
        customerEmail: '',
        customerName: '',
        companyName: '',
        licenseType: 'PROFESSIONAL',
        maxActivations: 1,
        purchaseAmount: 299.99,
        currency: 'USD',
      });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to generate license');
    }
  };

  const handleRevokeLicense = async (licenseKey: string) => {
    if (!confirm(t.licensing?.confirmRevoke || 'Are you sure you want to revoke this license?')) {
      return;
    }

    if (!token) return;

    try {
      await licensingAPI.revokeLicense(token, licenseKey, 'Manual revocation by admin');
      alert(t.licensing?.licenseRevoked || 'License revoked successfully');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to revoke license');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      SUSPENDED: 'bg-orange-100 text-orange-700',
      REVOKED: 'bg-red-100 text-red-700',
      EXPIRED: 'bg-gray-100 text-gray-700',
      EXHAUSTED: 'bg-red-100 text-red-700',
      ACTIVATED: 'bg-blue-100 text-blue-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t.licensing?.licenseManagement || 'License Management'}
          </h1>
          <p className="text-gray-600 mt-1">
            {t.licensing?.manageSubtitle || 'Manage licenses, trials, and monitor suspicious activities'}
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white 
                     rounded-lg font-medium hover:shadow-lg transition-all"
        >
          {t.licensing?.generateLicense || '+ Generate License'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('licenses')}
          className={`px-6 py-3 font-medium transition-all border-b-2 ${
            activeTab === 'licenses'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          {t.licensing?.licenses || 'Licenses'} ({licenses.length})
        </button>
        <button
          onClick={() => setActiveTab('trials')}
          className={`px-6 py-3 font-medium transition-all border-b-2 ${
            activeTab === 'trials'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          {t.licensing?.trials || 'Trials'} ({trials.length})
        </button>
        <button
          onClick={() => setActiveTab('suspicious')}
          className={`px-6 py-3 font-medium transition-all border-b-2 ${
            activeTab === 'suspicious'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          🚨 {t.licensing?.suspicious || 'Suspicious'} ({suspicious.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Licenses Tab */}
          {activeTab === 'licenses' && (
            <div className="space-y-4">
              {licenses.map((license) => (
                <div key={license.id} className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold font-mono text-gray-900">
                          {license.license_key}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(license.status)}`}>
                          {license.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">{t.licensing?.customer || 'Customer'}:</span>
                          <p className="font-medium text-gray-900">{license.customer_email}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">{t.licensing?.type || 'Type'}:</span>
                          <p className="font-medium text-gray-900">{license.license_type}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">{t.licensing?.activations || 'Activations'}:</span>
                          <p className="font-medium text-gray-900">
                            {license.activation_count}/{license.max_activations}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">{t.licensing?.expires || 'Expires'}:</span>
                          <p className="font-medium text-gray-900">
                            {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never'}
                          </p>
                        </div>
                      </div>
                    </div>
                    {!license.is_revoked && (
                      <button
                        onClick={() => handleRevokeLicense(license.license_key)}
                        className="ml-4 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100"
                      >
                        {t.licensing?.revoke || 'Revoke'}
                      </button>
                    )}
                  </div>
                  
                  {license.device_fingerprint && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">{t.licensing?.deviceBound || 'Device Bound'}:</p>
                      <p className="text-xs font-mono text-gray-500 break-all">{license.device_fingerprint}</p>
                    </div>
                  )}
                </div>
              ))}

              {licenses.length === 0 && (
                <div className="text-center py-12 text-gray-600">
                  {t.licensing?.noLicenses || 'No licenses generated yet'}
                </div>
              )}
            </div>
          )}

          {/* Trials Tab */}
          {activeTab === 'trials' && (
            <div className="space-y-4">
              {trials.map((trial) => (
                <div key={trial.id} className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {trial.trial_guest_id}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(trial.status)}`}>
                          {trial.status}
                        </span>
                        {trial.is_vm_detected && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                            VM
                          </span>
                        )}
                        {trial.is_suspicious && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                            🚨 Suspicious
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">{t.licensing?.credits || 'Credits'}:</span>
                          <p className="font-medium text-gray-900">
                            {trial.credits_used}/{trial.credits_allocated}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">{t.licensing?.remaining || 'Remaining'}:</span>
                          <p className={`font-medium ${trial.credits_remaining === 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {trial.credits_remaining}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">{t.licensing?.started || 'Started'}:</span>
                          <p className="font-medium text-gray-900">
                            {new Date(trial.trial_started_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">{t.licensing?.lastSeen || 'Last Seen'}:</span>
                          <p className="font-medium text-gray-900">
                            {new Date(trial.last_seen_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">{t.licensing?.deviceFingerprint || 'Device Fingerprint'}:</p>
                    <p className="text-xs font-mono text-gray-500 break-all">{trial.device_fingerprint}</p>
                  </div>
                </div>
              ))}

              {trials.length === 0 && (
                <div className="text-center py-12 text-gray-600">
                  {t.licensing?.noTrials || 'No trial sessions found'}
                </div>
              )}
            </div>
          )}

          {/* Suspicious Activities Tab */}
          {activeTab === 'suspicious' && (
            <div className="space-y-4">
              {suspicious.map((activity) => (
                <div key={activity.id} className="bg-red-50 rounded-xl shadow-md border-2 border-red-200 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-red-900">
                          {activity.activity_type.replace(/_/g, ' ')}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          activity.severity === 'CRITICAL' ? 'bg-red-200 text-red-900' :
                          activity.severity === 'HIGH' ? 'bg-orange-200 text-orange-900' :
                          activity.severity === 'MEDIUM' ? 'bg-yellow-200 text-yellow-900' :
                          'bg-blue-200 text-blue-900'
                        }`}>
                          {activity.severity}
                        </span>
                      </div>
                      <p className="text-sm text-red-800 mb-2">
                        {activity.description}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-xs text-red-700">
                        <div>
                          <span className="font-medium">{t.licensing?.detected || 'Detected'}:</span>
                          <span className="ml-1">{new Date(activity.detected_at).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="font-medium">{t.licensing?.action || 'Action'}:</span>
                          <span className="ml-1">{activity.action_taken}</span>
                        </div>
                      </div>
                      {activity.device_fingerprint && (
                        <div className="mt-2 pt-2 border-t border-red-200">
                          <p className="text-xs text-red-600 font-mono break-all">
                            Device: {activity.device_fingerprint}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {suspicious.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600">
                    {t.licensing?.noSuspicious || 'No suspicious activities detected'}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Generate License Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {t.licensing?.generateNewLicense || 'Generate New License'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.licensing?.customerEmail || 'Customer Email'} *
                  </label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.licensing?.customerName || 'Customer Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.licensing?.companyName || 'Company Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.licensing?.licenseType || 'License Type'}
                  </label>
                  <select
                    value={formData.licenseType}
                    onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TRIAL">Trial (50 credits)</option>
                    <option value="STARTER">Starter ($99/year)</option>
                    <option value="PROFESSIONAL">Professional ($299/year)</option>
                    <option value="ENTERPRISE">Enterprise ($999/year)</option>
                    <option value="MONTHLY">Monthly ($19/mo)</option>
                    <option value="YEARLY">Yearly ($199/year)</option>
                    <option value="PERPETUAL">Perpetual ($499)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.licensing?.purchaseAmount || 'Purchase Amount'}
                  </label>
                  <input
                    type="number"
                    value={formData.purchaseAmount}
                    onChange={(e) => setFormData({ ...formData, purchaseAmount: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.licensing?.maxActivations || 'Max Activations'}
                  </label>
                  <input
                    type="number"
                    value={formData.maxActivations}
                    onChange={(e) => setFormData({ ...formData, maxActivations: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100"
              >
                {t.common?.cancel || 'Cancel'}
              </button>
              <button
                onClick={handleGenerateLicense}
                disabled={!formData.customerEmail}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg
                           font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {t.licensing?.generate || 'Generate License'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenseManagementPage;





