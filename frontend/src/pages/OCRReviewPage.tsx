import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ocrAPI, OCRScan, OCRProduct } from '../api/ocr';

export const OCRReviewPage = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<OCRScan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; sku: string; price: string }>({
    name: '',
    sku: '',
    price: '',
  });
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadScan();
  }, [scanId]);

  const loadScan = async () => {
    try {
      setIsLoading(true);
      const response = await ocrAPI.getScanById(scanId!);
      setScan(response.data);
      
      // Auto-select all approved or high-confidence products
      const autoSelect = new Set<string>();
      response.data.products?.forEach((product) => {
        if (product.is_approved || (product.confidence_score && product.confidence_score > 80)) {
          autoSelect.add(product.id);
        }
      });
      setSelectedProducts(autoSelect);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load scan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = (product: OCRProduct) => {
    setEditingProduct(product.id);
    setEditForm({
      name: product.corrected_name || product.name,
      sku: product.corrected_sku || product.sku || '',
      price: String(product.corrected_price || product.unit_price || ''),
    });
  };

  const handleSaveCorrection = async (productId: string) => {
    try {
      await ocrAPI.correctProduct(productId, {
        name: editForm.name,
        sku: editForm.sku || undefined,
        price: parseFloat(editForm.price) || undefined,
      });
      setEditingProduct(null);
      loadScan();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to save correction');
    }
  };

  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkAdd = async () => {
    if (selectedProducts.size === 0) {
      alert('Please select at least one product');
      return;
    }

    try {
      setIsAdding(true);
      const result = await ocrAPI.bulkAddProducts(Array.from(selectedProducts));
      
      if (result.data.failed.length > 0) {
        alert(`Added ${result.data.added.length} products. ${result.data.failed.length} failed.`);
      } else {
        alert(`Successfully added ${result.data.added.length} products to inventory!`);
      }
      
      await ocrAPI.reviewScan(scanId!);
      navigate('/products');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to add products');
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading scan results...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !scan) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto mt-12">
          <div className="glass rounded-3xl p-8 text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Error</h2>
            <p className="text-slate-600 mb-6">{error || 'Scan not found'}</p>
            <button onClick={() => navigate('/ocr/scanner')} className="btn-primary">
              Back to Scanner
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass rounded-3xl p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">Review Extracted Products</h1>
              <p className="text-slate-600 text-sm">
                {scan.file_name} • {scan.products?.length || 0} products found • Confidence:{' '}
                {scan.confidence_score?.toFixed(1)}%
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/ocr/scanner')}
                className="btn-secondary"
              >
                New Scan
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Products', value: scan.products?.length || 0, icon: '📦', color: 'blue' },
            { label: 'Selected', value: selectedProducts.size, icon: '✅', color: 'green' },
            { label: 'Confidence', value: `${scan.confidence_score?.toFixed(0)}%`, icon: '🎯', color: 'purple' },
            { label: 'Processing Time', value: `${(scan.processing_time! / 1000).toFixed(1)}s`, icon: '⚡', color: 'yellow' },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
                </div>
                <div className="text-3xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Products Table */}
        <div className="glass rounded-3xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Extracted Products</h2>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (selectedProducts.size === scan.products?.length) {
                    setSelectedProducts(new Set());
                  } else {
                    setSelectedProducts(new Set(scan.products?.map((p) => p.id)));
                  }
                }}
                className="btn-secondary text-sm"
              >
                {selectedProducts.size === scan.products?.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleBulkAdd}
                disabled={selectedProducts.size === 0 || isAdding}
                className="btn-primary disabled:opacity-50"
              >
                {isAdding ? 'Adding...' : `Add ${selectedProducts.size} to Inventory`}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {scan.products?.map((product) => (
              <div
                key={product.id}
                className={`border-2 rounded-xl p-4 transition-all ${
                  selectedProducts.has(product.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                } ${product.is_added_to_inventory ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={() => toggleProductSelection(product.id)}
                    disabled={product.is_added_to_inventory}
                    className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />

                  {/* Product Info */}
                  <div className="flex-1">
                    {editingProduct === product.id ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                          placeholder="Product Name"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={editForm.sku}
                            onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                            className="px-3 py-2 border border-slate-300 rounded-lg"
                            placeholder="SKU"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                            className="px-3 py-2 border border-slate-300 rounded-lg"
                            placeholder="Price"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveCorrection(product.id)}
                            className="btn-primary text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingProduct(null)}
                            className="btn-secondary text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-800">
                            {product.corrected_name || product.name}
                          </h3>
                          {product.is_added_to_inventory && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                              ✓ Added
                            </span>
                          )}
                          {product.confidence_score && (
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              product.confidence_score > 80 ? 'bg-green-100 text-green-700' :
                              product.confidence_score > 60 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {product.confidence_score.toFixed(0)}% confidence
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">SKU:</span>
                            <span className="ml-2 font-medium">{product.corrected_sku || product.sku || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Price:</span>
                            <span className="ml-2 font-medium">
                              ${(product.corrected_price || product.unit_price || 0).toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Qty:</span>
                            <span className="ml-2 font-medium">{product.quantity || 1}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Total:</span>
                            <span className="ml-2 font-medium">
                              ${(product.total_price || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {product.matched_product && (
                          <p className="text-sm text-blue-600 mt-2">
                            ↔️ Matched with: {product.matched_product.name} ({product.matched_product.sku})
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {!product.is_added_to_inventory && editingProduct !== product.id && (
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};





