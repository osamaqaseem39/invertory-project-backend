import { app, BrowserWindow, ipcMain, Menu, dialog, shell } from 'electron';
import path from 'path';
import Store from 'electron-store';
import config from './config';
import { checkBackendHealth, checkFrontendAvailable, getConnectionStatus } from './utils';
import { createTray, updateTrayMenu, destroyTray } from './tray';
import {
  showNotification,
  showLowStockAlert,
  showOutOfStockAlert,
  showNewOrderNotification,
  showPaymentReceivedNotification,
  showBackupCompleteNotification,
  showErrorNotification,
  showSuccessNotification,
  areNotificationsSupported,
} from './notifications';
import {
  registerGlobalShortcuts,
  unregisterGlobalShortcuts,
  registerAppShortcuts,
  cleanupShortcuts,
} from './shortcuts';
import {
  printWindow,
  printReceipt,
  printToPDF,
  getAvailablePrinters,
  getDefaultPrinter,
  printInvoice,
  printReport,
} from './printer';
import {
  initializeAutoUpdater,
  setupAutoUpdaterHandlers,
  checkForUpdatesManually,
  getAutoUpdateConfig,
} from './updater';

// Secure storage for tokens
const store = new Store({
  encryptionKey: config.security.encryptionKey,
});

let mainWindow: BrowserWindow | null = null;
let connectionCheckInterval: NodeJS.Timeout | null = null;

/**
 * Create the main application window
 */
async function createWindow() {
  // Check backend health before starting
  console.log('🔍 Checking backend connection...');
  const backendHealth = await checkBackendHealth(config.backend.url);

  if (!backendHealth.isHealthy) {
    const response = await dialog.showMessageBox({
      type: 'warning',
      title: 'Backend Not Available',
      message: 'Cannot connect to backend server',
      detail: `Backend URL: ${config.backend.url}\n\nThe backend server is not responding. The app may not function correctly.`,
      buttons: ['Continue Anyway', 'Exit'],
      defaultId: 0,
      cancelId: 1,
    });

    if (response.response === 1) {
      app.quit();
      return;
    }
  } else {
    console.log('✅ Backend is healthy');
  }

  // Create browser window
  mainWindow = new BrowserWindow({
    width: config.window.width,
    height: config.window.height,
    minWidth: config.window.minWidth,
    minHeight: config.window.minHeight,
    title: config.app.name,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: false,
    backgroundColor: config.window.backgroundColor,
    show: false, // Don't show until ready
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (config.env.isDevelopment && config.devTools.autoOpen) {
      mainWindow?.webContents.openDevTools();
    }
  });

  // Load frontend
  try {
    if (config.env.isDevelopment) {
      console.log(`📱 Loading frontend from: ${config.frontend.devUrl}`);
      const frontendAvailable = await checkFrontendAvailable(config.frontend.devUrl);

      if (!frontendAvailable) {
        throw new Error(`Frontend dev server not available at ${config.frontend.devUrl}`);
      }

      await mainWindow.loadURL(config.frontend.devUrl);
    } else {
      console.log('📦 Loading frontend from production build');
      const prodPath = path.join(__dirname, config.frontend.prodPath);
      await mainWindow.loadFile(prodPath);
    }
  } catch (error) {
    console.error('❌ Failed to load frontend:', error);
    await dialog.showErrorBox(
      'Failed to Load',
      `Could not load the application interface.\n\n${error instanceof Error ? error.message : 'Unknown error'}`
    );
    app.quit();
    return;
  }

  // Handle navigation
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Allow only same-origin navigation
    const urlObj = new URL(url);
    if (config.env.isDevelopment) {
      if (!url.startsWith(config.frontend.devUrl)) {
        event.preventDefault();
      }
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval);
    }
  });

  // Start connection monitoring
  startConnectionMonitoring();

  // Create application menu
  createAppMenu();

  // ===== PHASE 3: DESKTOP-NATIVE FEATURES =====
  
  // Create system tray
  createTray(mainWindow);
  
  // Register global shortcuts
  registerGlobalShortcuts(mainWindow);
  
  // Register app-specific shortcuts
  registerAppShortcuts(mainWindow);
  
  // Initialize auto-updater
  const updateConfig = getAutoUpdateConfig();
  if (updateConfig.enabled && updateConfig.url) {
    initializeAutoUpdater(updateConfig.url);
    setupAutoUpdaterHandlers(mainWindow);
  }
  
  // Check if notifications are supported
  if (areNotificationsSupported()) {
    console.log('✅ Native notifications supported');
  } else {
    console.log('⚠️  Native notifications not supported on this platform');
  }
}

/**
 * Create application menu
 */
function createAppMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Refresh',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.reload(),
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: async () => {
            await dialog.showMessageBox({
              type: 'info',
              title: 'About',
              message: config.app.name,
              detail: `Version: ${config.app.version}\n\nElectron Desktop Application for complete inventory management.`,
            });
          },
        },
        {
          label: 'Check Backend Status',
          click: async () => {
            const status = await getConnectionStatus(config.backend.url, config.frontend.devUrl);
            await dialog.showMessageBox({
              type: 'info',
              title: 'Connection Status',
              message: 'System Status',
              detail: `Backend: ${status.backend.isHealthy ? '✅ Connected' : '❌ Disconnected'}\nFrontend: ${
                status.frontend.isAvailable ? '✅ Available' : '❌ Unavailable'
              }\n\nTimestamp: ${status.timestamp}`,
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Monitor backend connection
 */
function startConnectionMonitoring() {
  // Check every 30 seconds
  connectionCheckInterval = setInterval(async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const health = await checkBackendHealth(config.backend.url);
      mainWindow.webContents.send('backend-status', {
        isHealthy: health.isHealthy,
        timestamp: new Date().toISOString(),
      });
    }
  }, 30000);
}

// ===== APP LIFECYCLE =====

app.whenReady().then(async () => {
  console.log('🚀 Electron main process started');
  console.log(`📦 App: ${config.app.name} v${config.app.version}`);
  console.log(`🌍 Environment: ${config.env.isDevelopment ? 'Development' : 'Production'}`);
  console.log(`💻 Platform: ${process.platform}`);
  console.log(`🔗 Backend URL: ${config.backend.url}`);
  console.log(`📱 Frontend URL: ${config.env.isDevelopment ? config.frontend.devUrl : 'Production Build'}`);

  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }
  // Cleanup Phase 3 features
  unregisterGlobalShortcuts();
  destroyTray();
});

// ===== SECURE IPC HANDLERS =====

// Store secure data (tokens, session data, etc.)
ipcMain.handle('store-secure-data', async (_event, key: string, value: any) => {
  try {
    store.set(key, value);
    console.log(`🔒 Stored secure data: ${key}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to store data: ${key}`, error);
    return { success: false, error: (error as Error).message };
  }
});

// Retrieve secure data
ipcMain.handle('get-secure-data', async (_event, key: string) => {
  try {
    const value = store.get(key);
    console.log(`🔓 Retrieved secure data: ${key}`);
    return { success: true, data: value };
  } catch (error) {
    console.error(`❌ Failed to retrieve data: ${key}`, error);
    return { success: false, error: (error as Error).message };
  }
});

// Delete secure data
ipcMain.handle('delete-secure-data', async (_event, key: string) => {
  try {
    store.delete(key);
    console.log(`🗑️  Deleted secure data: ${key}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to delete data: ${key}`, error);
    return { success: false, error: (error as Error).message };
  }
});

// Clear all secure data (logout)
ipcMain.handle('clear-all-data', async () => {
  try {
    store.clear();
    console.log('🗑️  Cleared all secure data');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to clear data', error);
    return { success: false, error: (error as Error).message };
  }
});

// Get app version
ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

// Get app info
ipcMain.handle('get-app-info', async () => {
  return {
    name: config.app.name,
    version: config.app.version,
    platform: process.platform,
    arch: process.arch,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  };
});

// Get app path
ipcMain.handle('get-app-path', async () => {
  return app.getAppPath();
});

// Check backend health
ipcMain.handle('check-backend-health', async () => {
  const health = await checkBackendHealth(config.backend.url);
  return health;
});

// Get connection status
ipcMain.handle('get-connection-status', async () => {
  return await getConnectionStatus(config.backend.url, config.frontend.devUrl);
});

// Quit app
ipcMain.handle('quit-app', async () => {
  app.quit();
});

// Minimize window
ipcMain.handle('minimize-window', async () => {
  mainWindow?.minimize();
});

// Maximize/restore window
ipcMain.handle('toggle-maximize-window', async () => {
  if (mainWindow?.isMaximized()) {
    mainWindow?.restore();
  } else {
    mainWindow?.maximize();
  }
});

// Log message (for debugging)
ipcMain.handle('log-message', async (_event, message: string, level: 'info' | 'warn' | 'error' = 'info') => {
  console[level](`[Renderer]: ${message}`);
  return { success: true };
});

// Show error dialog
ipcMain.handle('show-error', async (_event, title: string, message: string) => {
  await dialog.showErrorBox(title, message);
  return { success: true };
});

// Show message box
ipcMain.handle('show-message', async (_event, options: Electron.MessageBoxOptions) => {
  const response = await dialog.showMessageBox(options);
  return response;
});

// ===== PHASE 3: NATIVE FEATURES IPC HANDLERS =====

// Show notification
ipcMain.handle('show-notification', async (_event, options) => {
  try {
    showNotification(options);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Show low stock alert
ipcMain.handle('show-low-stock-alert', async (_event, productName: string, current: number, min: number) => {
  try {
    showLowStockAlert(productName, current, min);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Show out of stock alert
ipcMain.handle('show-out-of-stock-alert', async (_event, productName: string) => {
  try {
    showOutOfStockAlert(productName);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Show new order notification
ipcMain.handle('show-new-order-notification', async (_event, orderNumber: string, amount: number) => {
  try {
    showNewOrderNotification(orderNumber, amount);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Show payment received notification
ipcMain.handle('show-payment-received-notification', async (_event, amount: number, customer: string) => {
  try {
    showPaymentReceivedNotification(amount, customer);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Show backup complete notification
ipcMain.handle('show-backup-complete-notification', async (_event, size: string) => {
  try {
    showBackupCompleteNotification(size);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Show error notification
ipcMain.handle('show-error-notification', async (_event, title: string, error: string) => {
  try {
    showErrorNotification(title, error);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Show success notification
ipcMain.handle('show-success-notification', async (_event, title: string, message: string) => {
  try {
    showSuccessNotification(title, message);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Print window
ipcMain.handle('print-window', async (_event, options) => {
  if (!mainWindow) return { success: false, error: 'No window available' };
  return await printWindow(mainWindow, options);
});

// Print receipt
ipcMain.handle('print-receipt', async (_event, receiptHtml: string, printerName?: string) => {
  if (!mainWindow) return { success: false, error: 'No window available' };
  return await printReceipt(mainWindow, receiptHtml, printerName);
});

// Print to PDF
ipcMain.handle('print-to-pdf', async (_event, outputPath: string, options) => {
  if (!mainWindow) return { success: false, error: 'No window available' };
  return await printToPDF(mainWindow, outputPath, options);
});

// Get available printers
ipcMain.handle('get-available-printers', async () => {
  if (!mainWindow) return [];
  return await getAvailablePrinters(mainWindow);
});

// Get default printer
ipcMain.handle('get-default-printer', async () => {
  if (!mainWindow) return null;
  return await getDefaultPrinter(mainWindow);
});

// Print invoice
ipcMain.handle('print-invoice', async (_event, invoiceHtml: string, options) => {
  if (!mainWindow) return { success: false, error: 'No window available' };
  return await printInvoice(mainWindow, invoiceHtml, options);
});

// Print report
ipcMain.handle('print-report', async (_event, reportHtml: string, options) => {
  if (!mainWindow) return { success: false, error: 'No window available' };
  return await printReport(mainWindow, reportHtml, options);
});

// Check for updates
ipcMain.handle('check-for-updates', async () => {
  if (!mainWindow) return;
  await checkForUpdatesManually(mainWindow);
});

// Are notifications supported
ipcMain.handle('are-notifications-supported', async () => {
  return areNotificationsSupported();
});

console.log('✅ Phase 2 IPC handlers registered');
console.log('✅ Phase 3 IPC handlers registered (Native features)');
console.log('🎯 Application ready');
