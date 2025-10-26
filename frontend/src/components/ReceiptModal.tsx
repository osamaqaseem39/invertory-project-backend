import { useState, useRef } from 'react';
import { ReceiptData } from '../api/receipts';
import { useTranslation } from '../i18n/i18nContext';

interface ReceiptModalProps {
  receiptData: ReceiptData;
  receiptId: string;
  onClose: () => void;
  onEmail?: (email: string) => void;
  onReprint?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receiptData,
  receiptId: _receiptId,
  onClose,
  onEmail,
  onReprint,
}) => {
  const { t, language } = useTranslation();
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState('');
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    if (onEmail && email.trim()) {
      onEmail(email.trim());
      setShowEmailDialog(false);
      setEmail('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h2 className="text-2xl font-bold">{t.receipt.title}</h2>
              <p className="text-blue-100 text-sm">{receiptData.receipt_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Receipt Content */}
        <div className="flex-1 overflow-y-auto p-6" ref={receiptRef}>
          <div className="max-w-md mx-auto bg-white border-2 border-gray-200 rounded-lg p-6 print:border-0 print:p-0">
            {/* Business Info */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">{receiptData.business_name}</h1>
              {receiptData.business_address && (
                <p className="text-sm text-gray-600 whitespace-pre-line">{receiptData.business_address}</p>
              )}
              {receiptData.business_phone && (
                <p className="text-sm text-gray-600">{receiptData.business_phone}</p>
              )}
              {receiptData.business_email && (
                <p className="text-sm text-gray-600">{receiptData.business_email}</p>
              )}
              {receiptData.tax_id && (
                <p className="text-sm text-gray-600">{language === 'ar' ? 'الرقم الضريبي:' : 'Tax ID:'} {receiptData.tax_id}</p>
              )}
            </div>

            {receiptData.header_text && (
              <div className="text-center text-sm text-gray-700 mb-4 border-t border-b border-gray-300 py-2">
                {receiptData.header_text}
              </div>
            )}

            <div className="border-t-2 border-dashed border-gray-400 my-4"></div>

            {/* Transaction Info */}
            <div className="space-y-1 text-sm mb-4">
              <div className="flex justify-between">
                <span className="font-semibold">Receipt #:</span>
                <span>{receiptData.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Transaction:</span>
                <span>{receiptData.transaction_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Date:</span>
                <span>{new Date(receiptData.transaction_date).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Cashier:</span>
                <span>{receiptData.cashier_name}</span>
              </div>
              {receiptData.customer && (
                <div className="flex justify-between">
                  <span className="font-semibold">Customer:</span>
                  <span>{receiptData.customer.name} ({receiptData.customer.customer_number})</span>
                </div>
              )}
            </div>

            <div className="border-t-2 border-dashed border-gray-400 my-4"></div>

            {/* Items */}
            <div className="space-y-3 mb-4">
              {receiptData.items.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>{item.name}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      {item.quantity} x ${item.unit_price.toFixed(2)}
                      {item.discount_percentage > 0 && ` (-${item.discount_percentage}%)`}
                    </span>
                    <span className="font-semibold text-gray-800">${item.line_total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-dashed border-gray-400 my-4"></div>

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${receiptData.subtotal.toFixed(2)}</span>
              </div>
              {receiptData.discount_total > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>-${receiptData.discount_total.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${receiptData.tax_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t-2 border-gray-400 pt-2">
                <span>TOTAL:</span>
                <span>${receiptData.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-gray-400 my-4"></div>

            {/* Payment */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Payment ({receiptData.payment_method}):</span>
                <span>${receiptData.amount_tendered.toFixed(2)}</span>
              </div>
              {receiptData.change_amount > 0 && (
                <div className="flex justify-between font-semibold">
                  <span>Change:</span>
                  <span>${receiptData.change_amount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {receiptData.coupon_code && (
              <>
                <div className="border-t-2 border-dashed border-gray-400 my-4"></div>
                <div className="text-center text-sm">
                  <p className="font-semibold">Coupon Applied: {receiptData.coupon_code}</p>
                </div>
              </>
            )}

            {receiptData.loyalty_points_earned && (
              <div className="text-center text-sm">
                <p>Points Earned: {receiptData.loyalty_points_earned}</p>
              </div>
            )}

            {receiptData.qr_code_data && (
              <>
                <div className="border-t-2 border-dashed border-gray-400 my-4"></div>
                <div className="flex flex-col items-center">
                  <img src={receiptData.qr_code_data} alt="QR Code" className="w-32 h-32" />
                  <p className="text-xs text-gray-600 mt-2">Scan for digital receipt</p>
                </div>
              </>
            )}

            {receiptData.return_policy && (
              <>
                <div className="border-t-2 border-dashed border-gray-400 my-4"></div>
                <div className="text-center text-xs text-gray-600">
                  <p className="font-semibold mb-1">{language === 'ar' ? 'سياسة الإرجاع' : 'Return Policy'}</p>
                  <p>{receiptData.return_policy}</p>
                </div>
              </>
            )}

            {receiptData.footer_text && (
              <>
                <div className="border-t-2 border-dashed border-gray-400 my-4"></div>
                <div className="text-center text-sm text-gray-700">
                  <p className="whitespace-pre-line">{receiptData.footer_text}</p>
                </div>
              </>
            )}

            <div className="text-center text-xs text-gray-500 mt-4">
              {new Date().toLocaleString()}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 p-6 flex gap-3 flex-wrap print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 min-w-[150px] bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
          >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {t.receipt.print}
            </button>

          {onEmail && (
            <button
              onClick={() => setShowEmailDialog(true)}
              className="flex-1 min-w-[150px] bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t.receipt.email}
            </button>
          )}

          {onReprint && (
            <button
              onClick={onReprint}
              className="flex-1 min-w-[150px] bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t.receipt.reprint}
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-1 min-w-[150px] bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            {t.common.close}
          </button>
        </div>

        {/* Email Dialog */}
        {showEmailDialog && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">{t.receipt.emailTo}</h3>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={handleEmail}
                  disabled={!email.trim()}
                  className="flex-1 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.receipt.send}
                </button>
                <button
                  onClick={() => {
                    setShowEmailDialog(false);
                    setEmail('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  {t.common.cancel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:border-0,
          .print\\:border-0 * {
            visibility: visible;
          }
          .print\\:border-0 {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
          }
        }
      `}</style>
    </div>
  );
};

export default ReceiptModal;

