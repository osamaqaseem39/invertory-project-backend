import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../i18n/i18nContext';
import { StockAdjustment, AdjustmentReason, AdjustmentStatus, UserRole, Product } from '../types';
import { inventoryAPI } from '../api/inventory';
import { productsAPI } from '../api/products';

export const StockAdjustmentsPage = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<AdjustmentStatus | ''>('');
  
  const [formData, setFormData] = useState({
    product_id: '',
    new_quantity: 0,
    reason: AdjustmentReason.COUNT_ERROR,
    notes: '',
  });

  const canCreate = [UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MANAGER].includes(user?.role as UserRole);
  const canApprove = [UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN].includes(user?.role as UserRole);

  useEffect(() => {
    loadAdjustments();
    loadProducts();
  }, [filterStatus]);

  const loadAdjustments = async () => {
    setIsLoading(true);
    try {
      const result = await inventoryAPI.listStockAdjustments(filterStatus ? { status: filterStatus } : undefined);
      setAdjustments(result.data || []);
    } catch (err) {
      console.error('Failed to load adjustments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const result = await productsAPI.list({ is_active: true });
      setProducts(result.data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inventoryAPI.createStockAdjustment({
        product_id: formData.product_id,
        new_quantity: formData.new_quantity,
        reason: formData.reason,
        notes: formData.notes || undefined,
      });
      alert('✅ Stock adjustment created! Awaiting approval.');
      setShowModal(false);
      loadAdjustments();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create adjustment');
    }
  };

  const handleApprove = async (id: string, approved: boolean) => {
    const action = approved ? 'approve' : 'reject';
    if (!window.confirm(`${approved ? 'Approve' : 'Reject'} this stock adjustment?`)) return;

    try {
      await inventoryAPI.approveStockAdjustment(id, approved);
      alert(`✅ Stock adjustment ${approved ? 'approved' : 'rejected'} successfully!`);
      loadAdjustments();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || `Failed to ${action} adjustment`);
    }
  };

  const getStatusBadge = (status: AdjustmentStatus) => {
    const colors = {
      [AdjustmentStatus.PENDING]: 'bg-yellow-100 text-yellow-700',
      [AdjustmentStatus.APPROVED]: 'bg-green-100 text-green-700',
      [AdjustmentStatus.REJECTED]: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getReasonDisplay = (reason: AdjustmentReason) => {
    return reason.replace(/_/g, ' ');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="glass rounded-3xl p-6 shadow-xl animate-slide-down flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">{t.nav.stockAdjustments}</h1>
            <p className="text-slate-600 text-sm">Manual stock corrections with approval workflow</p>
          </div>
          {canCreate && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Adjustment
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="glass rounded-2xl p-4 shadow-lg">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-semibold text-slate-700">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AdjustmentStatus | '')}
              className="input-field flex-1 max-w-xs"
            >
              <option value="">All Status</option>
              <option value={AdjustmentStatus.PENDING}>Pending</option>
              <option value={AdjustmentStatus.APPROVED}>Approved</option>
              <option value={AdjustmentStatus.REJECTED}>Rejected</option>
            </select>
          </div>
        </div>

        {/* Adjustments List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-12 text-center glass rounded-3xl">
              <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-600">Loading adjustments...</p>
            </div>
          ) : adjustments.length === 0 ? (
            <div className="p-12 text-center glass rounded-3xl">
              <p className="text-slate-600 mb-4">No adjustments found</p>
              {canCreate && (
                <button onClick={() => setShowModal(true)} className="btn-primary">
                  Create First Adjustment
                </button>
              )}
            </div>
          ) : (
            adjustments.map((adj, index) => (
              <div
                key={adj.id}
                className="glass rounded-2xl p-6 shadow-lg animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{adj.adjustment_number}</h3>
                    <p className="text-sm text-slate-600">
                      {adj.product?.name || 'Unknown Product'} ({adj.product?.sku})
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-xl font-semibold text-sm ${getStatusBadge(adj.status)}`}>
                    {adj.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="glass rounded-lg p-3">
                    <div className="text-xs text-slate-600 mb-1">Old Quantity</div>
                    <div className="text-lg font-bold text-slate-800">{adj.old_quantity}</div>
                  </div>
                  <div className="glass rounded-lg p-3">
                    <div className="text-xs text-slate-600 mb-1">New Quantity</div>
                    <div className="text-lg font-bold text-primary-600">{adj.new_quantity}</div>
                  </div>
                  <div className="glass rounded-lg p-3">
                    <div className="text-xs text-slate-600 mb-1">Difference</div>
                    <div className={`text-lg font-bold ${adj.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {adj.difference >= 0 ? '+' : ''}{adj.difference}
                    </div>
                  </div>
                  <div className="glass rounded-lg p-3">
                    <div className="text-xs text-slate-600 mb-1">Reason</div>
                    <div className="text-sm font-semibold text-slate-800">{getReasonDisplay(adj.reason)}</div>
                  </div>
                </div>

                {adj.notes && (
                  <div className="mb-4 p-3 glass rounded-lg">
                    <div className="text-xs font-semibold text-slate-600 mb-1">Notes:</div>
                    <div className="text-sm text-slate-700">{adj.notes}</div>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-slate-500 mb-4">
                  <span>Created: {new Date(adj.created_at).toLocaleString()}</span>
                  {adj.approved_at && <span>Approved: {new Date(adj.approved_at).toLocaleString()}</span>}
                </div>

                {canApprove && adj.status === AdjustmentStatus.PENDING && (
                  <div className="flex gap-2 pt-3 border-t border-slate-200">
                    <button
                      onClick={() => handleApprove(adj.id, true)}
                      className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition-colors"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleApprove(adj.id, false)}
                      className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-colors"
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Adjustment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="glass rounded-3xl p-8 max-w-xl w-full shadow-2xl animate-scale-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Create Stock Adjustment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Product *</label>
                <select
                  value={formData.product_id}
                  onChange={(e) => {
                    const productId = e.target.value;
                    const product = products.find(p => p.id === productId);
                    setFormData({
                      ...formData,
                      product_id: productId,
                      new_quantity: product?.stock_quantity || 0,
                    });
                  }}
                  required
                  className="input-field"
                >
                  <option value="">Select Product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Current: {p.stock_quantity}
                    </option>
                  ))}
                </select>
              </div>

              {formData.product_id && (
                <>
                  <div className="glass rounded-lg p-4">
                    <div className="text-sm text-slate-600 mb-2">Current Stock:</div>
                    <div className="text-3xl font-bold text-slate-800">
                      {products.find(p => p.id === formData.product_id)?.stock_quantity || 0}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">New Quantity *</label>
                    <input
                      type="number"
                      value={formData.new_quantity}
                      onChange={(e) => setFormData({ ...formData, new_quantity: parseInt(e.target.value) || 0 })}
                      required
                      min="0"
                      className="input-field"
                      placeholder="0"
                    />
                  </div>

                  <div className="glass rounded-lg p-4">
                    <div className="text-sm text-slate-600 mb-1">Difference:</div>
                    <div className={`text-2xl font-bold ${(formData.new_quantity - (products.find(p => p.id === formData.product_id)?.stock_quantity || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(formData.new_quantity - (products.find(p => p.id === formData.product_id)?.stock_quantity || 0)) >= 0 ? '+' : ''}
                      {formData.new_quantity - (products.find(p => p.id === formData.product_id)?.stock_quantity || 0)}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Reason *</label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value as AdjustmentReason })}
                  required
                  className="input-field"
                >
                  <option value={AdjustmentReason.COUNT_ERROR}>Count Error</option>
                  <option value={AdjustmentReason.DAMAGE}>Damage</option>
                  <option value={AdjustmentReason.THEFT}>Theft</option>
                  <option value={AdjustmentReason.EXPIRED}>Expired</option>
                  <option value={AdjustmentReason.LOST}>Lost</option>
                  <option value={AdjustmentReason.OTHER}>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Explain the reason for this adjustment..."
                />
              </div>

              <div className="glass rounded-xl p-4 bg-blue-50/50 border border-blue-200">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Approval Required:</p>
                    <p>Stock adjustments require approval from Admin or Owner before stock is updated.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  Create Adjustment Request
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-8">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

