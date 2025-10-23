import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { notificationsAPI, Notification } from '../api/notifications';

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'stock' | 'po' | 'payment'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      
      const params: any = { limit: 100 };
      
      if (filter === 'unread') params.isRead = false;
      if (filter === 'stock') params.type = 'STOCK_LOW';
      if (filter === 'po') params.type = 'PO_PENDING_APPROVAL';
      if (filter === 'payment') params.type = 'PAYMENT_OVERDUE';

      const result = await notificationsAPI.getNotifications(params);
      setNotifications(result.data);
      setUnreadCount(result.unread);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDismiss = async (notificationId: string) => {
    try {
      await notificationsAPI.dismissNotification(notificationId);
      loadNotifications();
    } catch (err) {
      console.error('Failed to dismiss:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'border-l-red-500 bg-red-50';
      case 'HIGH':
        return 'border-l-orange-500 bg-orange-50';
      case 'MEDIUM':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('STOCK')) return '📦';
    if (type.includes('PO')) return '📋';
    if (type.includes('PAYMENT')) return '💰';
    return '🔔';
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass rounded-3xl p-6 shadow-xl animate-slide-down">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">🔔 Notifications</h1>
              <p className="text-slate-600 text-sm">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/notifications/preferences')}
                className="btn-secondary text-sm"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </button>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllAsRead} className="btn-primary text-sm">
                  Mark All Read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass rounded-2xl p-4 shadow-lg">
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'All', icon: '📋' },
              { value: 'unread', label: 'Unread', icon: '🔵', count: unreadCount },
              { value: 'stock', label: 'Stock Alerts', icon: '📦' },
              { value: 'po', label: 'Purchase Orders', icon: '📝' },
              { value: 'payment', label: 'Payments', icon: '💰' },
            ].map((filterOption) => (
              <button
                key={filterOption.value}
                onClick={() => setFilter(filterOption.value as any)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filter === filterOption.value
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {filterOption.icon} {filterOption.label}
                {filterOption.count !== undefined && filterOption.count > 0 && (
                  <span className="ml-2 bg-white text-primary-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    {filterOption.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="glass rounded-3xl p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center">
              <svg className="w-20 h-20 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-xl font-semibold text-slate-700 mb-2">No notifications</p>
              <p className="text-slate-500">You're all caught up! 🎉</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`glass rounded-2xl p-5 border-l-4 ${getPriorityColor(notification.priority)} ${
                  !notification.is_read ? 'shadow-lg' : 'shadow'
                } animate-slide-down hover:shadow-xl transition-all`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-4xl flex-shrink-0">
                    {getTypeIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className={`text-lg font-bold ${!notification.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          NEW
                        </span>
                      )}
                    </div>

                    {/* Message */}
                    <p className="text-slate-600 mb-3">{notification.message}</p>

                    {/* Metadata */}
                    {notification.metadata && (
                      <div className="bg-white/50 rounded-lg p-3 mb-3 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          {notification.metadata.product_sku && (
                            <div>
                              <span className="text-slate-500">SKU:</span>
                              <span className="ml-2 font-medium">{notification.metadata.product_sku}</span>
                            </div>
                          )}
                          {notification.metadata.current_stock !== undefined && (
                            <div>
                              <span className="text-slate-500">Current Stock:</span>
                              <span className="ml-2 font-medium text-red-600">
                                {notification.metadata.current_stock} units
                              </span>
                            </div>
                          )}
                          {notification.metadata.reorder_level !== undefined && (
                            <div>
                              <span className="text-slate-500">Reorder Level:</span>
                              <span className="ml-2 font-medium">{notification.metadata.reorder_level} units</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Priority */}
                      <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${getPriorityBadge(notification.priority)}`}>
                        {notification.priority}
                      </span>

                      {/* Time */}
                      <span className="text-sm text-slate-500">
                        {new Date(notification.created_at).toLocaleString()}
                      </span>

                      {/* Actions */}
                      <div className="ml-auto flex gap-2">
                        {notification.action_url && (
                          <button
                            onClick={() => {
                              if (!notification.is_read) handleMarkAsRead(notification.id);
                              navigate(notification.action_url!);
                            }}
                            className="btn-primary text-sm"
                          >
                            View Product →
                          </button>
                        )}
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="btn-secondary text-sm"
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => handleDismiss(notification.id)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};





