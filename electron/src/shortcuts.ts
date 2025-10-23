/**
 * Global Keyboard Shortcuts
 * Register system-wide keyboard shortcuts for quick actions
 */

import { app, globalShortcut, BrowserWindow } from 'electron';

/**
 * Register all global shortcuts
 */
export function registerGlobalShortcuts(mainWindow: BrowserWindow | null): void {
  // Toggle main window visibility
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    console.log('🔥 Global shortcut: Toggle window');
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // Quick access to POS
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    console.log('🔥 Global shortcut: Open POS');
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('navigate', '/pos');
    }
  });

  // Quick access to Dashboard
  globalShortcut.register('CommandOrControl+Shift+D', () => {
    console.log('🔥 Global shortcut: Open Dashboard');
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('navigate', '/dashboard');
    }
  });

  // Quick search
  globalShortcut.register('CommandOrControl+Shift+F', () => {
    console.log('🔥 Global shortcut: Quick search');
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('trigger-search');
    }
  });

  // Quick inventory check
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    console.log('🔥 Global shortcut: Stock check');
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('navigate', '/stock');
    }
  });

  console.log('✅ Global shortcuts registered:');
  console.log('   • Cmd/Ctrl+Shift+I - Toggle window');
  console.log('   • Cmd/Ctrl+Shift+P - Open POS');
  console.log('   • Cmd/Ctrl+Shift+D - Open Dashboard');
  console.log('   • Cmd/Ctrl+Shift+F - Quick search');
  console.log('   • Cmd/Ctrl+Shift+S - Stock check');
}

/**
 * Unregister all global shortcuts
 */
export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll();
  console.log('🗑️  Global shortcuts unregistered');
}

/**
 * Check if a shortcut is registered
 */
export function isShortcutRegistered(accelerator: string): boolean {
  return globalShortcut.isRegistered(accelerator);
}

/**
 * Register application shortcuts (window-specific)
 */
export function registerAppShortcuts(mainWindow: BrowserWindow): void {
  // These are handled via the menu, but we can add additional logic here
  
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Handle Escape key to close modals or go back
    if (input.key === 'Escape' && input.type === 'keyDown') {
      mainWindow.webContents.send('escape-pressed');
    }

    // Handle F11 for fullscreen
    if (input.key === 'F11' && input.type === 'keyDown') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }

    // Handle Cmd/Ctrl+P for print
    if ((input.control || input.meta) && input.key === 'p' && input.type === 'keyDown') {
      event.preventDefault();
      mainWindow.webContents.send('trigger-print');
    }

    // Handle Cmd/Ctrl+N for new transaction
    if ((input.control || input.meta) && input.key === 'n' && input.type === 'keyDown') {
      mainWindow.webContents.send('new-transaction');
    }

    // Handle Cmd/Ctrl+, for settings
    if ((input.control || input.meta) && input.key === ',' && input.type === 'keyDown') {
      event.preventDefault();
      mainWindow.webContents.send('navigate', '/settings');
    }
  });

  console.log('✅ Application shortcuts registered');
}

/**
 * Cleanup shortcuts on app quit
 */
export function cleanupShortcuts(): void {
  app.on('will-quit', () => {
    unregisterGlobalShortcuts();
  });
}




