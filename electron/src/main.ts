import { app, BrowserWindow, ipcMain, Menu, dialog, shell } from 'electron';
import path from 'path';
import Store from 'electron-store';
import config from './config';

// Secure storage for tokens
const store = new Store({
  encryptionKey: 'inventory-app-secure-key-2025',
});

let mainWindow: BrowserWindow | null = null;

/**
 * Create the main application window
 */
async function createWindow() {
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
    backgroundColor: '#667eea',
    show: false, // Don't show until ready
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (process.env.NODE_ENV === 'development') {
      mainWindow?.webContents.openDevTools();
    }
  });

  // Load frontend
  try {
    console.log('📱 Loading application from backend server...');
    console.log(`🌐 Connecting to: ${config.backend.current}`);
    await mainWindow.loadURL(config.backend.current);
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
  mainWindow.webContents.on('will-navigate', (event: any, url: string) => {
    // Allow navigation to configured backend URLs
    const allowedUrls = [config.backend.local, config.backend.deployed];
    
    if (!allowedUrls.some(allowedUrl => url.startsWith(allowedUrl))) {
      event.preventDefault();
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }: any) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createAppMenu();
}

/**
 * Create application menu with Arabic language support
 */
function createAppMenu() {
  const template: any[] = [
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
          label: 'Language / اللغة',
          submenu: [
            {
              label: 'English',
              click: () => {
                mainWindow?.webContents.send('set-language', 'en');
              },
            },
            {
              label: 'العربية',
              click: () => {
                mainWindow?.webContents.send('set-language', 'ar');
              },
            },
          ],
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
              detail: `Version: ${config.app.version}\n\n${config.app.description}\n\nFeatures:\n• Bilingual UI (English/Arabic)\n• RTL text direction support\n• Native desktop notifications\n• Receipt printing\n• Secure data storage\n• Cloud backend integration`,
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ===== APP LIFECYCLE =====

app.whenReady().then(async () => {
  console.log('🚀 Electron main process started');
  console.log(`📦 App: Inventory Management System v1.0.0`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV === 'development' ? 'Development' : 'Production'}`);
  console.log(`💻 Platform: ${process.platform}`);

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

// ===== SECURE IPC HANDLERS =====

// Store secure data (tokens, session data, etc.)
ipcMain.handle('store-secure-data', async (_event: any, key: string, value: any) => {
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
ipcMain.handle('get-secure-data', async (_event: any, key: string) => {
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
ipcMain.handle('delete-secure-data', async (_event: any, key: string) => {
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
    backend: config.backend.current,
  };
});

// Language switching
ipcMain.handle('set-language', async (_event: any, language: 'en' | 'ar') => {
  try {
    // Store language preference
    store.set('language', language);
    
    // Send language change to renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('language-changed', language);
    }
    
    console.log(`🌍 Language set to: ${language}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to set language:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Get current language
ipcMain.handle('get-language', async () => {
  try {
    const language = store.get('language', 'en');
    return { success: true, language };
  } catch (error) {
    console.error('❌ Failed to get language:', error);
    return { success: false, error: (error as Error).message };
  }
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
ipcMain.handle('log-message', async (_event: any, message: string, level: 'info' | 'warn' | 'error' = 'info') => {
  console[level](`[Renderer]: ${message}`);
  return { success: true };
});

// Show error dialog
ipcMain.handle('show-error', async (_event: any, title: string, message: string) => {
  await dialog.showErrorBox(title, message);
  return { success: true };
});

// Show message box
ipcMain.handle('show-message', async (_event: any, options: any) => {
  const response = await dialog.showMessageBox(options);
  return response;
});

console.log('✅ IPC handlers registered');
console.log('🎯 Application ready');