import axios from 'axios';

const API_BASE_URL = 'https://invertory-project-backend.vercel.app/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Notification {
  id: string;
  type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  resource_type?: string;
  resource_id?: string;
  action_url?: string;
  metadata?: any;
  user_id?: string;
  role_target?: string;
  is_read: boolean;
  is_dismissed: boolean;
  read_at?: string;
  dismissed_at?: string;
  channels: string[];
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  enable_in_app: boolean;
  enable_email: boolean;
  enable_sms: boolean;
  enable_push: boolean;
  stock_alerts: boolean;
  po_alerts: boolean;
  payment_alerts: boolean;
  system_alerts: boolean;
  quiet_hours_start?: number;
  quiet_hours_end?: number;
  daily_digest: boolean;
  digest_time?: number;
  created_at: string;
  updated_at: string;
}

export const notificationsAPI = {
  // Get user's notifications
  getNotifications: async (params?: {
    isRead?: boolean;
    type?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Notification[];
    total: number;
    page: number;
    limit: number;
    pages: number;
    unread: number;
  }> => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<{ data: Notification }> => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async (): Promise<any> => {
    const response = await api.patch('/notifications/mark-all-read');
    return response.data;
  },

  // Dismiss notification
  dismissNotification: async (notificationId: string): Promise<{ data: Notification }> => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Get preferences
  getPreferences: async (): Promise<{ data: NotificationPreferences }> => {
    const response = await api.get('/notifications/preferences');
    return response.data;
  },

  // Update preferences
  updatePreferences: async (preferences: Partial<NotificationPreferences>): Promise<{ data: NotificationPreferences }> => {
    const response = await api.patch('/notifications/preferences', preferences);
    return response.data;
  },

  // Trigger stock monitor
  triggerStockCheck: async (): Promise<{ data: { checked: number; alertsTriggered: number } }> => {
    const response = await api.post('/notifications/stock-monitor/trigger');
    return response.data;
  },

  // Get monitor status
  getMonitorStatus: async (): Promise<{ data: any }> => {
    const response = await api.get('/notifications/stock-monitor/status');
    return response.data;
  },

  // Configure stock alert
  configureStockAlert: async (config: {
    productId: string;
    alertType: string;
    threshold: number;
    cooldownHours?: number;
  }): Promise<{ data: any }> => {
    const response = await api.post('/notifications/stock-alerts/configure', config);
    return response.data;
  },

  // Get product alerts
  getProductAlerts: async (productId: string): Promise<{ data: any[] }> => {
    const response = await api.get(`/notifications/stock-alerts/product/${productId}`);
    return response.data;
  },
};





