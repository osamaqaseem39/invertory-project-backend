import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/i18nContext';
import licensingAPI from '../api/licensing';
import { getOrGenerateFingerprint } from '../utils/device-fingerprint';

const LicenseActivationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [licenseKey, setLicenseKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  const [hardwareSignature, setHardwareSignature] = useState('');

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  const loadDeviceInfo = async () => {
    const fingerprint = await getOrGenerateFingerprint();
    setDeviceFingerprint(fingerprint.deviceFingerprint);
    setHardwareSignature(fingerprint.hardwareSignature);
  };

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError(t.licensing?.enterLicenseKey || 'Please enter a license key');
      return;
    }

    try {
      setActivating(true);
      setError(null);

      const result = await licensingAPI.activateLicense(
        licenseKey.trim().toUpperCase(),
        deviceFingerprint,
        hardwareSignature,
        'ONLINE'
      );

      // Success!
      alert(t.licensing?.activationSuccess || 'License activated successfully! Welcome to the full version.');
      
      // Redirect to dashboard
      navigate('/');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Activation failed. Please check your license key.';
      setError(errorMessage);
    } finally {
      setActivating(false);
    }
  };

  const formatLicenseKey = (value: string): string => {
    // Remove non-alphanumeric characters
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    // Split into groups of 8
    const groups = cleaned.match(/.{1,8}/g) || [];
    
    // Join with hyphens (max 4 groups)
    return groups.slice(0, 4).join('-');
  };

  const handleLicenseKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatLicenseKey(e.target.value);
    setLicenseKey(formatted);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t.licensing?.activateTitle || 'Activate Your License'}
          </h1>
          <p className="text-gray-600">
            {t.licensing?.activateSubtitle || 'Enter your license key to unlock the full version'}
          </p>
        </div>

        {/* Activation Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="space-y-6">
            {/* License Key Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.licensing?.licenseKey || 'License Key'}
              </label>
              <input
                type="text"
                value={licenseKey}
                onChange={handleLicenseKeyChange}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                maxLength={35} // 32 chars + 3 hyphens
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-mono text-lg
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase
                           text-center tracking-wider"
                disabled={activating}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t.licensing?.licenseKeyHint || 'Enter the 32-character license key you received via email'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      {t.licensing?.activationFailed || 'Activation Failed'}
                    </p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Device Info Display */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">
                {t.licensing?.thisDevice || 'This Device:'}
              </p>
              <p className="text-xs font-mono text-gray-600 break-all">
                {deviceFingerprint}
              </p>
            </div>

            {/* Activate Button */}
            <button
              onClick={handleActivate}
              disabled={activating || !licenseKey || licenseKey.length < 15}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white 
                         rounded-lg font-medium text-lg hover:shadow-xl transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {activating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t.licensing?.activating || 'Activating...'}
                </span>
              ) : (
                t.licensing?.activateButton || 'Activate License'
              )}
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t.licensing?.howToActivate || 'How to Activate'}
          </h3>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                1
              </span>
              <span>
                {t.licensing?.step1 || 'Purchase a license from our website or contact sales'}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                2
              </span>
              <span>
                {t.licensing?.step2 || 'You will receive a 32-character license key via email'}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                3
              </span>
              <span>
                {t.licensing?.step3 || 'Enter the license key above and click "Activate License"'}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                4
              </span>
              <span>
                {t.licensing?.step4 || 'Your software will be activated and all features unlocked'}
              </span>
            </li>
          </ol>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              {t.licensing?.dontHaveLicense || "Don't have a license yet?"}
            </p>
            <a
              href="https://inventorypro.com/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              {t.licensing?.viewPricing || 'View Pricing & Purchase'}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseActivationPage;





