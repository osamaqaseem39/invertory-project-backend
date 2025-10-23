import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useTranslation } from '../i18n/i18nContext';
import { StockMovement, StockMovementType } from '../types';
import { inventoryAPI } from '../api/inventory';

export const StockMovementsPage = () => {
  const { t } = useTranslation();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<StockMovementType | ''>('');

  useEffect(() => {
    loadMovements();
  }, [filterType]);

  const loadMovements = async () => {
    setIsLoading(true);
    try {
      const result = await inventoryAPI.listStockMovements(
        filterType ? { movement_type: filterType } : { limit: 50 }
      );
      setMovements(result.data || []);
    } catch (err) {
      console.error('Failed to load stock movements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getMovementIcon = (type: StockMovementType) => {
    const icons = {
      [StockMovementType.IN]: '📥',
      [StockMovementType.OUT]: '📤',
      [StockMovementType.ADJUSTMENT]: '⚙️',
      [StockMovementType.TRANSFER_IN]: '⬅️',
      [StockMovementType.TRANSFER_OUT]: '➡️',
      [StockMovementType.RETURN]: '🔄',
      [StockMovementType.DAMAGE]: '⚠️',
    };
    return icons[type] || '📦';
  };

  const getMovementColor = (type: StockMovementType) => {
    const colors = {
      [StockMovementType.IN]: 'from-green-500 to-emerald-500',
      [StockMovementType.OUT]: 'from-red-500 to-pink-500',
      [StockMovementType.ADJUSTMENT]: 'from-blue-500 to-cyan-500',
      [StockMovementType.TRANSFER_IN]: 'from-indigo-500 to-purple-500',
      [StockMovementType.TRANSFER_OUT]: 'from-orange-500 to-amber-500',
      [StockMovementType.RETURN]: 'from-teal-500 to-green-500',
      [StockMovementType.DAMAGE]: 'from-gray-500 to-slate-500',
    };
    return colors[type] || 'from-gray-500 to-slate-500';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="glass rounded-3xl p-6 shadow-xl animate-slide-down">
          <h1 className="text-3xl font-bold gradient-text mb-2">{t.nav.stockMovements}</h1>
          <p className="text-slate-600 text-sm">{t.inventory.auditTrail || 'Complete audit trail of all stock changes'}</p>
        </div>

        {/* Filter */}
        <div className="glass rounded-2xl p-4 shadow-lg">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-semibold text-slate-700">Movement Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as StockMovementType | '')}
              className="input-field flex-1 max-w-xs"
            >
              <option value="">All Types</option>
              <option value={StockMovementType.IN}>Goods In (Purchase)</option>
              <option value={StockMovementType.OUT}>Goods Out (Sale)</option>
              <option value={StockMovementType.ADJUSTMENT}>Adjustment</option>
              <option value={StockMovementType.TRANSFER_IN}>Transfer In</option>
              <option value={StockMovementType.TRANSFER_OUT}>Transfer Out</option>
              <option value={StockMovementType.RETURN}>Return</option>
              <option value={StockMovementType.DAMAGE}>Damage/Write-off</option>
            </select>
          </div>
        </div>

        {/* Movements Timeline */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="p-12 text-center glass rounded-3xl">
              <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-600">Loading movements...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="p-12 text-center glass rounded-3xl">
              <p className="text-slate-600">No stock movements found</p>
            </div>
          ) : (
            movements.map((movement, index) => (
              <div
                key={movement.id}
                className="glass rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all animate-fade-in flex gap-4"
                style={{ animationDelay: `${index * 0.02}s`, animationFillMode: 'both' }}
              >
                {/* Icon */}
                <div className={`w-12 h-12 bg-gradient-to-br ${getMovementColor(movement.movement_type)} rounded-xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}>
                  {getMovementIcon(movement.movement_type)}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-slate-800">{movement.product?.name || 'Unknown Product'}</h4>
                      <p className="text-xs text-slate-500">SKU: {movement.product?.sku}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${movement.movement_type === StockMovementType.IN ? 'text-green-600' : 'text-slate-800'}`}>
                        {movement.movement_type === StockMovementType.IN ? '+' : ''}{movement.quantity}
                      </div>
                      <div className="text-xs text-slate-500">{movement.movement_type.replace(/_/g, ' ')}</div>
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs text-slate-600">
                    {movement.reference_number && (
                      <span className="px-2 py-1 bg-slate-100 rounded font-mono">{movement.reference_number}</span>
                    )}
                    <span>{new Date(movement.created_at).toLocaleString()}</span>
                  </div>

                  {movement.reason && (
                    <p className="text-sm text-slate-600 mt-2">{movement.reason}</p>
                  )}

                  {(movement.from_location || movement.to_location) && (
                    <div className="mt-2 flex gap-2 text-xs">
                      {movement.from_location && <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">From: {movement.from_location}</span>}
                      {movement.to_location && <span className="px-2 py-1 bg-green-100 text-green-700 rounded">To: {movement.to_location}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

