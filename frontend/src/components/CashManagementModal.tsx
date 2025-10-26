import { useState } from 'react';
import { CashEventType } from '../types';
import { professionalPOSAPI } from '../api/professional-pos';
import { useTranslation } from '../i18n/i18nContext';

interface CashManagementModalProps {
  sessionId: string;
  onClose: () => void;
  onSuccess: () => void;
  type: CashEventType;
}

export const CashManagementModal: React.FC<CashManagementModalProps> = ({
  sessionId,
  onClose,
  onSuccess,
  type,
}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const getTitle = () => {
    switch (type) {
      case CashEventType.PAID_IN:
        return t.pos.session;
      case CashEventType.PAID_OUT:
        return t.pos.session;
      case CashEventType.NO_SALE:
        return t.pos.session;
      case CashEventType.CASH_DROP:
        return t.pos.session;
      case CashEventType.PETTY_CASH:
        return t.pos.session;
      default:
        return t.pos.session;
    }
  };

  const getReasonPlaceholder = () => {
    switch (type) {
      case CashEventType.PAID_IN:
        return 'e.g., Change from bank, Customer payment deposit';
      case CashEventType.PAID_OUT:
        return 'e.g., Supplier payment, Petty cash withdrawal';
      case CashEventType.NO_SALE:
        return 'e.g., Customer needs change, Drawer count';
      case CashEventType.CASH_DROP:
        return 'e.g., Hourly drop to safe';
      default:
        return 'Enter reason';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (type !== CashEventType.NO_SALE && (!amount || amount <= 0)) {
      setError('Amount must be greater than zero');
      return;
    }

    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }

    setIsProcessing(true);

    try {
      await professionalPOSAPI.cashManagement.createCashEvent({
        session_id: sessionId,
        type,
        amount: type === CashEventType.NO_SALE ? undefined : amount,
        reason: reason.trim(),
        reference: reference.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to record cash event');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-2xl font-bold text-gray-800">{getTitle()}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount (not for NO_SALE) */}
          {type !== CashEventType.NO_SALE && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.common.amount} *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.inventory.reason} *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={getReasonPlaceholder()}
            />
          </div>

          {/* Reference (optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.payments.referenceNumber}
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Invoice #, receipt #, etc."
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? t.common.loading : t.common.submit}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              {t.common.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};





