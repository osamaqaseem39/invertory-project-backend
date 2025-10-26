import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { FileUpload } from '../components/FileUpload';
import { ocrAPI } from '../api/ocr';
import { useTranslation } from '../i18n/i18nContext';

export const OCRScannerPage = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<'RECEIPT' | 'INVOICE' | 'PURCHASE_ORDER' | 'PRICE_LIST'>('RECEIPT');
  const [sourceReference, setSourceReference] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string>('');

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError('');

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview('');
    }
  };

  const handleUploadAndProcess = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      // Upload document
      const uploadResponse = await ocrAPI.uploadDocument(selectedFile, sourceType, sourceReference);
      const scanId = uploadResponse.data.id;

      setIsUploading(false);
      setIsProcessing(true);

      // Process OCR
      const processResponse = await ocrAPI.processScan(scanId);

      if (processResponse.data.status === 'COMPLETED') {
        // Navigate to review page
        navigate(`/ocr/review/${scanId}`);
      } else {
        setError(processResponse.data.errorMessage || 'OCR processing failed');
        setIsProcessing(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Upload failed');
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview('');
    setSourceReference('');
    setError('');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass rounded-3xl p-6 shadow-xl animate-slide-down">
          <h1 className="text-3xl font-bold gradient-text mb-2">📸 {t.ocr.ocrScanner}</h1>
          <p className="text-slate-600 text-sm">
            {t.ocr.uploadDocument}
          </p>
        </div>

        {/* Upload Form */}
        <div className="glass rounded-3xl p-8 shadow-xl animate-scale-in">
          <div className="space-y-6">
            {/* Source Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t.ocr.documentType} *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'RECEIPT', label: `🧾 ${t.ocr.receipt}`, icon: '🧾' },
                  { value: 'INVOICE', label: `📄 ${t.ocr.invoice}`, icon: '📄' },
                  { value: 'PURCHASE_ORDER', label: `📋 ${t.ocr.purchaseOrder}`, icon: '📋' },
                  { value: 'PRICE_LIST', label: `💰 ${t.ocr.priceList}`, icon: '💰' },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSourceType(type.value as any)}
                    className={`
                      p-4 rounded-xl border-2 transition-all duration-200 text-center
                      ${
                        sourceType === type.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                          : 'border-slate-300 hover:border-blue-300 hover:bg-slate-50'
                      }
                    `}
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className="text-sm font-medium">{type.label.replace(/[^\w\s]/g, '')}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t.ocr.referenceNumber} <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                value={sourceReference}
                onChange={(e) => setSourceReference(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: INV-2024-001' : 'e.g., INV-2024-001'}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* File Upload */}
            {!selectedFile ? (
              <FileUpload
                onFileSelect={handleFileSelect}
                accept="image/jpeg,image/png,application/pdf"
                maxSize={10 * 1024 * 1024}
                label="Upload Document"
                description="Drag & drop or click to select"
              />
            ) : (
              <div className="space-y-4">
                {/* File Info */}
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="font-semibold text-slate-800">{selectedFile.name}</p>
                        <p className="text-sm text-slate-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-red-600 hover:text-red-700 hover:bg-red-100 p-2 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Preview */}
                {preview && (
                  <div className="border-2 border-slate-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Preview:</p>
                    <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md" />
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            {/* Processing Status */}
            {(isUploading || isProcessing) && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-lg font-semibold text-blue-900">
                  {isUploading ? 'Uploading document...' : 'Processing OCR... This may take a few seconds'}
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  {isProcessing && 'Extracting product information from your document'}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleUploadAndProcess}
                disabled={!selectedFile || isUploading || isProcessing}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading || isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {t.ocr.uploadAndProcess}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="btn-secondary px-8"
                disabled={isUploading || isProcessing}
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="glass rounded-2xl p-6 bg-blue-50 border-2 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            {t.ocr.uploadDocument}
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">1.</span>
              <span>{t.ocr.uploadDocument}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">2.</span>
              <span>{t.ocr.extractedProducts}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">3.</span>
              <span>Review and correct the extracted data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">4.</span>
              <span>Bulk add products to your inventory with one click</span>
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};





