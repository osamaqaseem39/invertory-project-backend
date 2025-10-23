import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/i18nContext';
import licensingAPI, { TrialStats } from '../api/licensing';
import { getOrGenerateFingerprint } from '../utils/device-fingerprint';

const TrialDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [trialStats, setTrialStats] = useState<TrialStats | null>(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeTrial();
  }, []);

  const initializeTrial = async () => {
    try {
      setLoading(true);

      // Get or generate device fingerprint
      const fingerprint = await getOrGenerateFingerprint();
      setDeviceFingerprint(fingerprint.deviceFingerprint);

      // Check trial status
      const stats = await licensingAPI.getTrialStats(fingerprint.deviceFingerprint);
      setTrialStats(stats);

      // If trial requires activation, redirect
      if (stats.status === 'EXHAUSTED' || stats.credits_remaining === 0) {
        // Don't auto-redirect, let user see status first
      }
    } catch (err: any) {
      console.error('Trial initialization error:', err);
      setError(err.response?.data?.error?.message || 'Failed to load trial information');
    } finally {
      setLoading(false);
    }
  };

  const getCreditColor = (remaining: number, total: number): string => {
    const percentage = (remaining / total) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCreditBgColor = (remaining: number, total: number): string => {
    const percentage = (remaining / total) * 100;
    if (percentage > 50) return 'bg-green-100 border-green-300';
    if (percentage > 20) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            {t.licensing?.error || 'Error'}
          </h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!trialStats) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            {t.licensing?.noTrial || 'No Trial Found'}
          </h3>
          <p className="text-blue-700 mb-4">
            {t.licensing?.startTrialPrompt || 'Start your free trial to get 50 free invoices!'}
          </p>
          <button
            onClick={() => navigate('/licensing/activate')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            {t.licensing?.startTrial || 'Start Free Trial'}
          </button>
        </div>
      </div>
    );
  }

  const isExhausted = trialStats.credits_remaining === 0;
  const isLowCredits = trialStats.credits_remaining > 0 && trialStats.credits_remaining <= 10;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {t.licensing?.trialDashboard || 'Trial Dashboard'}
        </h1>
        <p className="text-gray-600 mt-1">
          {t.licensing?.trialSubtitle || 'Monitor your trial usage and upgrade to full version'}
        </p>
      </div>

      {/* Credits Warning Banner */}
      {isExhausted && (
        <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-900 mb-2">
                {t.licensing?.trialExhausted || 'Trial Exhausted'}
              </h3>
              <p className="text-red-700 mb-4">
                {t.licensing?.exhaustedMessage || 'You have used all 50 free invoices. Upgrade to continue using the software.'}
              </p>
              <button
                onClick={() => navigate('/licensing/activate')}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 hover:shadow-lg transition-all"
              >
                {t.licensing?.upgradeNow || 'Upgrade Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLowCredits && !isExhausted && (
        <div className="mb-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-900 mb-2">
                {t.licensing?.lowCredits || 'Low Credits Warning'}
              </h3>
              <p className="text-yellow-700">
                {t.licensing?.lowCreditsMessage || `Only ${trialStats.credits_remaining} invoices remaining. Consider upgrading soon.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trial Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Credits Remaining */}
        <div className={`rounded-xl shadow-md p-6 border-2 ${getCreditBgColor(trialStats.credits_remaining, trialStats.credits_allocated)}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">
              {t.licensing?.creditsRemaining || 'Credits Remaining'}
            </h3>
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className={`text-4xl font-bold ${getCreditColor(trialStats.credits_remaining, trialStats.credits_allocated)}`}>
            {trialStats.credits_remaining}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            of {trialStats.credits_allocated} invoices
          </p>
          {/* Progress bar */}
          <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                trialStats.credits_remaining > 25 ? 'bg-green-500' :
                trialStats.credits_remaining > 10 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${(trialStats.credits_remaining / trialStats.credits_allocated) * 100}%` }}
            />
          </div>
        </div>

        {/* Credits Used */}
        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">
              {t.licensing?.creditsUsed || 'Credits Used'}
            </h3>
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-4xl font-bold text-gray-900">
            {trialStats.credits_used}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            invoices created
          </p>
        </div>

        {/* Trial Status */}
        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">
              {t.licensing?.status || 'Status'}
            </h3>
            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {trialStats.status}
          </p>
          {trialStats.is_vm_detected && (
            <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
              VM Detected
            </span>
          )}
          {trialStats.is_suspicious && (
            <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs rounded ml-1">
              Suspicious
            </span>
          )}
        </div>

        {/* Trial Started */}
        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">
              {t.licensing?.trialStarted || 'Trial Started'}
            </h3>
            <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">
            {new Date(trialStats.trial_started_at).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {new Date(trialStats.trial_started_at).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Device Information */}
      <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t.licensing?.deviceInfo || 'Device Information'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">{t.licensing?.trialGuestId || 'Trial Guest ID'}:</span>
            <p className="font-mono text-xs text-gray-600 mt-1 bg-gray-100 p-2 rounded">
              {trialStats.trial_guest_id}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700">{t.licensing?.deviceFingerprint || 'Device Fingerprint'}:</span>
            <p className="font-mono text-xs text-gray-600 mt-1 bg-gray-100 p-2 rounded break-all">
              {deviceFingerprint.substring(0, 32)}...
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {trialStats.credit_ledger && trialStats.credit_ledger.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t.licensing?.recentActivity || 'Recent Activity'}
          </h3>
          <div className="space-y-2">
            {trialStats.credit_ledger.slice(0, 10).map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    entry.entry_type === 'CONSUME' ? 'bg-red-500' : 'bg-green-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {entry.action || entry.entry_type}
                    </p>
                    {entry.reference_id && (
                      <p className="text-xs text-gray-600">{entry.reference_id}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    entry.amount < 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {entry.amount > 0 ? '+' : ''}{entry.amount}
                  </p>
                  <p className="text-xs text-gray-600">
                    {new Date(entry.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-2">
            {t.licensing?.upgradeToPro || 'Upgrade to Professional'}
          </h3>
          <p className="text-blue-100 mb-4">
            {t.licensing?.upgradeDescription || 'Get unlimited invoices, advanced features, and priority support.'}
          </p>
          <button
            onClick={() => navigate('/licensing/activate')}
            className="w-full px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-all"
          >
            {t.licensing?.activateLicense || 'Activate License'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {t.licensing?.needHelp || 'Need Help?'}
          </h3>
          <p className="text-gray-600 mb-4 text-sm">
            {t.licensing?.helpDescription || 'Contact support for assistance with activation or billing questions.'}
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>support@inventorypro.com</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Documentation & FAQ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialDashboardPage;





