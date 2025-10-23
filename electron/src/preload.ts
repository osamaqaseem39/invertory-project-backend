import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Secure storage
  storeSecureData: (key: string, value: any) => ipcRenderer.invoke('store-secure-data', key, value),
  getSecureData: (key: string) => ipcRenderer.invoke('get-secure-data', key),
  deleteSecureData: (key: string) => ipcRenderer.invoke('delete-secure-data', key),
  clearAllData: () => ipcRenderer.invoke('clear-all-data'),

  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  // Connection monitoring
  checkBackendHealth: () => ipcRenderer.invoke('check-backend-health'),
  getConnectionStatus: () => ipcRenderer.invoke('get-connection-status'),
  onBackendStatus: (callback: (status: any) => void) => {
    ipcRenderer.on('backend-status', (_event, status) => callback(status));
  },

  // Window actions
  quitApp: () => ipcRenderer.invoke('quit-app'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('toggle-maximize-window'),

  // Dialogs
  showError: (title: string, message: string) => ipcRenderer.invoke('show-error', title, message),
  showMessage: (options: any) => ipcRenderer.invoke('show-message', options),

  // Logging
  logMessage: (message: string, level: 'info' | 'warn' | 'error') =>
    ipcRenderer.invoke('log-message', message, level),

  // ===== PHASE 3: NATIVE FEATURES =====
  
  // Notifications
  showNotification: (options: any) => ipcRenderer.invoke('show-notification', options),
  showLowStockAlert: (productName: string, current: number, min: number) =>
    ipcRenderer.invoke('show-low-stock-alert', productName, current, min),
  showOutOfStockAlert: (productName: string) =>
    ipcRenderer.invoke('show-out-of-stock-alert', productName),
  showNewOrderNotification: (orderNumber: string, amount: number) =>
    ipcRenderer.invoke('show-new-order-notification', orderNumber, amount),
  showPaymentReceivedNotification: (amount: number, customer: string) =>
    ipcRenderer.invoke('show-payment-received-notification', amount, customer),
  showBackupCompleteNotification: (size: string) =>
    ipcRenderer.invoke('show-backup-complete-notification', size),
  showErrorNotification: (title: string, error: string) =>
    ipcRenderer.invoke('show-error-notification', title, error),
  showSuccessNotification: (title: string, message: string) =>
    ipcRenderer.invoke('show-success-notification', title, message),
  areNotificationsSupported: () => ipcRenderer.invoke('are-notifications-supported'),

  // Printing
  printWindow: (options?: any) => ipcRenderer.invoke('print-window', options),
  printReceipt: (receiptHtml: string, printerName?: string) =>
    ipcRenderer.invoke('print-receipt', receiptHtml, printerName),
  printToPDF: (outputPath: string, options?: any) =>
    ipcRenderer.invoke('print-to-pdf', outputPath, options),
  getAvailablePrinters: () => ipcRenderer.invoke('get-available-printers'),
  getDefaultPrinter: () => ipcRenderer.invoke('get-default-printer'),
  printInvoice: (invoiceHtml: string, options?: any) =>
    ipcRenderer.invoke('print-invoice', invoiceHtml, options),
  printReport: (reportHtml: string, options?: any) =>
    ipcRenderer.invoke('print-report', reportHtml, options),

  // Auto-updater
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // Event listeners for shortcuts and navigation
  onNavigate: (callback: (route: string) => void) => {
    ipcRenderer.on('navigate', (_event, route) => callback(route));
  },
  onTriggerSearch: (callback: () => void) => {
    ipcRenderer.on('trigger-search', () => callback());
  },
  onTriggerPrint: (callback: () => void) => {
    ipcRenderer.on('trigger-print', () => callback());
  },
  onNewTransaction: (callback: () => void) => {
    ipcRenderer.on('new-transaction', () => callback());
  },
  onEscapePressed: (callback: () => void) => {
    ipcRenderer.on('escape-pressed', () => callback());
  },
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      storeSecureData: (key: string, value: any) => Promise<{ success: boolean; error?: string }>;
      getSecureData: (key: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      deleteSecureData: (key: string) => Promise<{ success: boolean; error?: string }>;
      clearAllData: () => Promise<{ success: boolean; error?: string }>;
      getAppVersion: () => Promise<string>;
      getAppInfo: () => Promise<any>;
      getAppPath: () => Promise<string>;
      checkBackendHealth: () => Promise<{ isHealthy: boolean; statusCode?: number; error?: string }>;
      getConnectionStatus: () => Promise<any>;
      onBackendStatus: (callback: (status: any) => void) => void;
      quitApp: () => Promise<void>;
      minimizeWindow: () => Promise<void>;
      toggleMaximizeWindow: () => Promise<void>;
      showError: (title: string, message: string) => Promise<{ success: boolean }>;
      showMessage: (options: any) => Promise<any>;
      logMessage: (message: string, level: 'info' | 'warn' | 'error') => Promise<{ success: boolean }>;
      
      // Phase 3: Native Features
      showNotification: (options: any) => Promise<{ success: boolean; error?: string }>;
      showLowStockAlert: (productName: string, current: number, min: number) => Promise<{ success: boolean; error?: string }>;
      showOutOfStockAlert: (productName: string) => Promise<{ success: boolean; error?: string }>;
      showNewOrderNotification: (orderNumber: string, amount: number) => Promise<{ success: boolean; error?: string }>;
      showPaymentReceivedNotification: (amount: number, customer: string) => Promise<{ success: boolean; error?: string }>;
      showBackupCompleteNotification: (size: string) => Promise<{ success: boolean; error?: string }>;
      showErrorNotification: (title: string, error: string) => Promise<{ success: boolean; error?: string }>;
      showSuccessNotification: (title: string, message: string) => Promise<{ success: boolean; error?: string }>;
      areNotificationsSupported: () => Promise<boolean>;
      printWindow: (options?: any) => Promise<{ success: boolean; error?: string }>;
      printReceipt: (receiptHtml: string, printerName?: string) => Promise<{ success: boolean; error?: string }>;
      printToPDF: (outputPath: string, options?: any) => Promise<{ success: boolean; path?: string; error?: string }>;
      getAvailablePrinters: () => Promise<any[]>;
      getDefaultPrinter: () => Promise<any | null>;
      printInvoice: (invoiceHtml: string, options?: any) => Promise<{ success: boolean; error?: string }>;
      printReport: (reportHtml: string, options?: any) => Promise<{ success: boolean; error?: string }>;
      checkForUpdates: () => Promise<void>;
      onNavigate: (callback: (route: string) => void) => void;
      onTriggerSearch: (callback: () => void) => void;
      onTriggerPrint: (callback: () => void) => void;
      onNewTransaction: (callback: () => void) => void;
      onEscapePressed: (callback: () => void) => void;
    };
  }
}

console.log('🔒 Preload script loaded - Secure IPC bridge active');
console.log('✅ Enhanced electron API available');


