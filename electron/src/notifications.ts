/**
 * Native Notifications Manager
 * Handles desktop notifications for inventory alerts, low stock, etc.
 */

import { Notification, nativeImage } from 'electron';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  urgency?: 'normal' | 'critical' | 'low';
  silent?: boolean;
  timeoutType?: 'default' | 'never';
  actions?: Array<{ type: string; text: string }>;
}

/**
 * Show native desktop notification
 */
export function showNotification(options: NotificationOptions): Notification {
  const notification = new Notification({
    title: options.title,
    body: options.body,
    icon: options.icon,
    urgency: options.urgency || 'normal',
    silent: options.silent || false,
    timeoutType: options.timeoutType || 'default',
  });

  notification.show();

  notification.on('click', () => {
    console.log('📬 Notification clicked:', options.title);
  });

  notification.on('close', () => {
    console.log('📪 Notification closed:', options.title);
  });

  return notification;
}

/**
 * Show low stock alert
 */
export function showLowStockAlert(productName: string, currentStock: number, minStock: number): Notification {
  return showNotification({
    title: '⚠️ Low Stock Alert',
    body: `${productName} is running low!\nCurrent: ${currentStock} | Minimum: ${minStock}`,
    urgency: 'critical',
  });
}

/**
 * Show out of stock alert
 */
export function showOutOfStockAlert(productName: string): Notification {
  return showNotification({
    title: '🚨 Out of Stock',
    body: `${productName} is out of stock! Please reorder immediately.`,
    urgency: 'critical',
  });
}

/**
 * Show new order notification
 */
export function showNewOrderNotification(orderNumber: string, amount: number): Notification {
  return showNotification({
    title: '🛒 New Order',
    body: `Order #${orderNumber}\nAmount: $${amount.toFixed(2)}`,
    urgency: 'normal',
  });
}

/**
 * Show payment received notification
 */
export function showPaymentReceivedNotification(amount: number, customer: string): Notification {
  return showNotification({
    title: '💰 Payment Received',
    body: `$${amount.toFixed(2)} from ${customer}`,
    urgency: 'normal',
  });
}

/**
 * Show backup complete notification
 */
export function showBackupCompleteNotification(size: string): Notification {
  return showNotification({
    title: '✅ Backup Complete',
    body: `Database backup completed successfully.\nSize: ${size}`,
    urgency: 'low',
    silent: true,
  });
}

/**
 * Show sync complete notification
 */
export function showSyncCompleteNotification(itemsSync: number): Notification {
  return showNotification({
    title: '🔄 Sync Complete',
    body: `Synchronized ${itemsSync} items with cloud`,
    urgency: 'low',
    silent: true,
  });
}

/**
 * Show error notification
 */
export function showErrorNotification(title: string, error: string): Notification {
  return showNotification({
    title: `❌ ${title}`,
    body: error,
    urgency: 'critical',
  });
}

/**
 * Show success notification
 */
export function showSuccessNotification(title: string, message: string): Notification {
  return showNotification({
    title: `✅ ${title}`,
    body: message,
    urgency: 'normal',
    silent: true,
  });
}

/**
 * Show reminder notification
 */
export function showReminderNotification(title: string, message: string): Notification {
  return showNotification({
    title: `🔔 ${title}`,
    body: message,
    urgency: 'normal',
  });
}

/**
 * Show update available notification
 */
export function showUpdateAvailableNotification(version: string): Notification {
  return showNotification({
    title: '🎉 Update Available',
    body: `Version ${version} is available for download`,
    urgency: 'normal',
  });
}

/**
 * Check if notifications are supported
 */
export function areNotificationsSupported(): boolean {
  return Notification.isSupported();
}

/**
 * Request notification permission (macOS)
 */
export async function requestNotificationPermission(): Promise<string> {
  // On macOS, we need to check permission
  if (process.platform === 'darwin') {
    // Electron automatically requests permission on first notification
    // No explicit API needed
    return 'granted';
  }
  return 'granted';
}




