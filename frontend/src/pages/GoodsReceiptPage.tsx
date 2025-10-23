import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../i18n/i18nContext';
import { PurchaseOrder, POStatus, UserRole } from '../types';
import { inventoryAPI } from '../api/inventory';

interface GRNItem {
  po_item_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  expected_quantity: number;
  received_quantity: number;
  damaged_quantity: number;
  notes: string;
}

export const GoodsReceiptPage = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [approvedPOs, setApprovedPOs] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    po_id: '',
    received_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: [] as GRNItem[],
  });

  const canCreateGRN = [UserRole.OWNER_ULTIMATE_SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MANAGER].includes(user?.role as UserRole);

  useEffect(() => {
    loadApprovedPOs();
  }, []);

  const loadApprovedPOs = async () => {
    setIsLoading(true);
    try {
      const result = await inventoryAPI.listPurchaseOrders({ status: POStatus.APPROVED });
      const partialResult = await inventoryAPI.listPurchaseOrders({ status: POStatus.PARTIALLY_RECEIVED });
      setApprovedPOs([...(result.data || []), ...(partialResult.data || [])]);
    } catch (err) {
      console.error('Failed to load approved POs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPO = async (poId: string) => {
    try {
      const po = await inventoryAPI.getPurchaseOrderById(poId);
      setSelectedPO(po);

      const items: GRNItem[] = (po.items || []).map(item => {
        const remainingQty = item.quantity - item.received_quantity;
        return {
          po_item_id: item.id,
          product_id: item.product_id,
          product_name: item.product?.name || 'Unknown',
          product_sku: item.product?.sku || '',
          expected_quantity: remainingQty,
          received_quantity: remainingQty,
          damaged_quantity: 0,
          notes: '',
        };
      });

      setFormData({
        po_id: poId,
        received_date: new Date().toISOString().split('T')[0],
        notes: '',
        items,
      });

      setShowModal(true);
    } catch (err) {
      console.error('Failed to load PO:', err);
      alert('Failed to load purchase order details');
    }
  };

  const handleItemChange = (index: number, field: keyof GRNItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that received + damaged <= expected
    for (const item of formData.items) {
      if (item.received_quantity + item.damaged_quantity > item.expected_quantity) {
        alert(`Error: Received + Damaged quantity cannot exceed expected quantity for ${item.product_name}`);
        return;
      }
    }

    try {
      await inventoryAPI.createGoodsReceipt({
        po_id: formData.po_id,
        received_date: formData.received_date,
        notes: formData.notes || undefined,
        items: formData.items.map(item => ({
          po_item_id: item.po_item_id,
          product_id: item.product_id,
          expected_quantity: item.expected_quantity,
          received_quantity: item.received_quantity,
          damaged_quantity: item.damaged_quantity,
          notes: item.notes || undefined,
        })),
      });

      alert('✅ Goods received successfully! Stock has been updated.');
      setShowModal(false);
      loadApprovedPOs();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create goods receipt');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="glass rounded-3xl p-6 shadow-xl animate-slide-down">
          <h1 className="text-3xl font-bold gradient-text mb-2">{t.nav.goodsReceipt}</h1>
          <p className="text-slate-600 text-sm">{t.inventory.receiveGoods || 'Receive goods against approved purchase orders'}</p>
        </div>

        {/* Approved POs */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Approved Purchase Orders</h2>
          <div className="space-y-4">
            {isLoading ? (
              <div className="p-12 text-center glass rounded-3xl">
                <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-600">Loading purchase orders...</p>
              </div>
            ) : approvedPOs.length === 0 ? (
              <div className="p-12 text-center glass rounded-3xl">
                <p className="text-slate-600 mb-2">No approved purchase orders awaiting receipt</p>
                <p className="text-sm text-slate-500">Purchase orders must be approved before goods can be received</p>
              </div>
            ) : (
              approvedPOs.map((po, index) => (
                <div
                  key={po.id}
                  className="glass rounded-2xl p-6 shadow-lg animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-slate-800">{po.po_number}</h3>
                        <span className={`px-3 py-1 rounded-lg font-semibold text-xs ${
                          po.status === POStatus.APPROVED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {po.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">
                        Supplier: <span className="font-semibold">{po.supplier?.name}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {po._count?.items || 0} items • ${po.total_amount.toFixed(2)}
                      </p>
                      {po.expected_date && (
                        <p className="text-xs text-slate-500">
                          Expected: {new Date(po.expected_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {canCreateGRN && (
                      <button
                        onClick={() => handleSelectPO(po.id)}
                        className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-semibold hover:bg-primary-200 transition-colors"
                      >
                        Receive Goods
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* GRN Modal */}
      {showModal && selectedPO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="glass rounded-3xl p-8 max-w-5xl w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Receive Goods</h2>
            <p className="text-sm text-slate-600 mb-6">PO: {selectedPO.po_number} • Supplier: {selectedPO.supplier?.name}</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Received Date *</label>
                  <input
                    type="date"
                    value={formData.received_date}
                    onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
              </div>

              {/* Items to Receive */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Items to Receive</h3>
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="glass rounded-xl p-4">
                      <div className="mb-3">
                        <div className="font-bold text-slate-800">{item.product_name}</div>
                        <div className="text-xs text-slate-500">SKU: {item.product_sku}</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="glass rounded-lg p-3 bg-blue-50/30">
                          <div className="text-xs text-slate-600 mb-1">Expected</div>
                          <div className="text-2xl font-bold text-blue-600">{item.expected_quantity}</div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Received *</label>
                          <input
                            type="number"
                            value={item.received_quantity}
                            onChange={(e) => handleItemChange(index, 'received_quantity', parseInt(e.target.value) || 0)}
                            required
                            min="0"
                            max={item.expected_quantity}
                            className="input-field"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Damaged</label>
                          <input
                            type="number"
                            value={item.damaged_quantity}
                            onChange={(e) => handleItemChange(index, 'damaged_quantity', parseInt(e.target.value) || 0)}
                            min="0"
                            className="input-field"
                          />
                        </div>

                        <div className="glass rounded-lg p-3 bg-green-50/30">
                          <div className="text-xs text-slate-600 mb-1">Net Received</div>
                          <div className="text-2xl font-bold text-green-600">
                            {item.received_quantity - item.damaged_quantity}
                          </div>
                        </div>
                      </div>

                      {/* Item Notes */}
                      <div className="mt-3">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                          className="input-field text-sm"
                          placeholder="Any discrepancies or notes..."
                        />
                      </div>

                      {/* Discrepancy Warning */}
                      {(item.received_quantity + item.damaged_quantity) !== item.expected_quantity && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex gap-2">
                            <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-sm text-yellow-800 font-semibold">
                              Discrepancy: Expected {item.expected_quantity}, Received {item.received_quantity + item.damaged_quantity}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* GRN Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Receipt Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                  rows={2}
                  placeholder="Overall notes about this receipt..."
                />
              </div>

              {/* Info Box */}
              <div className="glass rounded-xl p-4 bg-blue-50/50 border border-blue-200">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">What happens next:</p>
                    <p>• Product stock will be increased by net received quantity (received - damaged)</p>
                    <p>• Stock movements will be logged automatically</p>
                    <p>• Purchase order status will update to Partially Received or Received</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {t.inventory.completeReceipt || 'Complete Goods Receipt'}
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

