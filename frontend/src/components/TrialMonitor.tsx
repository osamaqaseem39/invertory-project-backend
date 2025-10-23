import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/i18nContext';
import licensingAPI from '../api/licensing';
import { getStoredFingerprint } from '../utils/device-fingerprint';

export const TrialMonitor: React.FC = () => {
  const { t } = useTranslation();
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isExhausted, setIsExhausted] = useState(false);

  useEffect(() => {
    checkTrialStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkTrialStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkTrialStatus = async () => {
    try {
      const fingerprint = getStoredFingerprint();
      if (!fingerprint) return;

      const stats = await licensingAPI.getTrialStats(fingerprint.deviceFingerprint);
      
      setCreditsRemaining(stats.credits_remaining);
      setIsExhausted(stats.status === 'EXHAUSTED' || stats.credits_remaining === 0);
      setShowWarning(stats.credits_remaining > 0 && stats.credits_remaining <= 10);
    } catch (error) {
      // Silently fail (user might not be in trial mode)
    }
  };

  // Don't show if not in trial mode or credits unknown
  if (creditsRemaining === null) {
    return null;
  }

  // Exhausted trial - critical alert
  if (isExhausted) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <div className="bg-red-500 text-white rounded-lg shadow-2xl p-4 max-w-sm">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="font-bold mb-1">
                {t.licensing?.trialExhausted || 'Trial Exhausted'}
              </p>
              <p className="text-sm text-red-100 mb-3">
                {t.licensing?.exhaustedMonitor || '0 invoices remaining'}
              </p>
              <Link
                to="/licensing/activate"
                className="block text-center w-full px-4 py-2 bg-white text-red-600 rounded-lg font-medium hover:bg-red-50 transition-all"
              >
                {t.licensing?.activateButton || 'Activate Now'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Low credits warning
  if (showWarning) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <div className="bg-yellow-500 text-white rounded-lg shadow-2xl p-4 max-w-sm">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-bold mb-1">
                {t.licensing?.lowCreditsWarning || 'Low Credits'}
              </p>
              <p className="text-sm text-yellow-100 mb-3">
                {creditsRemaining} {t.licensing?.invoicesRemaining || 'invoices remaining'}
              </p>
              <Link
                to="/licensing/trial"
                className="block text-center w-full px-4 py-2 bg-white text-yellow-600 rounded-lg font-medium hover:bg-yellow-50 transition-all text-sm"
              >
                {t.licensing?.viewDetails || 'View Details'}
              </Link>
            </div>
            <button
              onClick={() => setShowWarning(false)}
              className="text-white hover:text-yellow-100"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal status - compact badge
  return (
    <Link to="/licensing/trial" className="fixed bottom-6 right-6 z-40">
      <div className="bg-green-500 text-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2 hover:bg-green-600 transition-all">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium">{creditsRemaining} {t.licensing?.left || 'left'}</span>
      </div>
    </Link>
  );
};





