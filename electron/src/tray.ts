/**
 * System Tray Manager
 * Handles system tray icon, menu, and interactions
 */

import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import path from 'path';
import config from './config';

let tray: Tray | null = null;

/**
 * Create system tray icon and menu
 */
export function createTray(mainWindow: BrowserWindow | null): Tray {
  // Create tray icon
  // For now using a simple template, replace with actual icon file in production
  const icon = nativeImage.createEmpty();
  icon.addRepresentation({
    scaleFactor: 1.0,
    width: 16,
    height: 16,
    buffer: Buffer.from(
      '89504e470d0a1a0a0000000d494844520000001000000010080600000' +
      '01ff3ff610000000467414d410000b18f0bfc6105000000206348524d0' +
      '00007a8000001388400000fa00000080e80000753900000ea6000003a' +
      '98000179a9fc28fc00000006624b474400ff00ff00ffa0bda793000000' +
      '097048597300000b1300000b1301009a9c180000000774494d4507e40a' +
      '0d09281e6cf1a5e30000014d4944415438cbd59331681c411486dfd9dd' +
      '6ddb6db77bdd0b0b8788207a124b1045f105058d602b08828a68e1c2d2' +
      '4212f841ae5ca8d22056dc1af89041efd2c3c1621011058b146cac6c76' +
      'b7bdbdbdddecdaee766f77f7be7bc39fccce9b79f366de0c43e0fc3cf3' +
      '9b4f3e7bcf3cf34f7e1e00f8ff5f7e0a0078fe1c007e7e1e0078fe1c00' +
      '7e7e1e0078fe1c007e7e1e0078fe1c007e7e1e0078fe1c007e7e1e0078' +
      'fe1c007e7e1e0078fe1c007e7e1e0078fe1c007e7e1e0078fe1c007e7e' +
      '1e0078fe1c007e7e1e0078fe1c007e7e1e0078fe1c007e7e1e0078fe1c' +
      '007e7e1e0078fe1c007e7e1e0078fe1c007e7e1e0078fe1c007e7e1e00' +
      '78fe1c007e7e1e0078fe1c007e7e1e0078fe1c007e7e1e0078fe1c007e' +
      '7e1e0078fe1c007e7e1e0078fe1c007e7e1e0078fe1c007e7e1e0078fe' +
      '1c007e7e1e0078fe1c007e7e1e0078fe1c007e7e1e0078fe1c007e7e1e' +
      '0078fe1c007e7e1e0078fe1c007e7e1e0078fe1c007e7e1e0078fe1c00' +
      '7e7e1e0078fe1c007e7e1e0078fe1c007e7e1e0078fe1c007e7e1e0078' +
      'fe1c007e7e1e0078fe1c007e7e1e0078fe1c007e7e1e0078fe1c007e7e' +
      '1e0078fe1c007e7e1e0078fe1c007e7e1e0078fe1c007e7e1e0078fe1c' +
      '007e7e1e0078fe1c007e7e1e0078fe1c007e7e1e0078fe1c007e7e1e00' +
      '78fe1c007e7e1e0078fe1c007e7e1e0078fe1c007e7e1e0078fe1c007e' +
      '7e1e0078fe1c007e7e1e0078fe1c007e7e1e0078fe1c007e7e1e0000000' +
      '049454e44ae426082',
      'hex'
    ),
  });

  tray = new Tray(icon);

  // Set tooltip
  tray.setToolTip(config.app.name);

  // Create context menu
  updateTrayMenu(mainWindow);

  // Handle tray click events
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  tray.on('right-click', () => {
    tray?.popUpContextMenu();
  });

  console.log('✅ System tray created');
  return tray;
}

/**
 * Update tray menu
 */
export function updateTrayMenu(mainWindow: BrowserWindow | null): void {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: config.app.name,
      enabled: false,
    },
    {
      type: 'separator',
    },
    {
      label: mainWindow?.isVisible() ? 'Hide Window' : 'Show Window',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
    },
    {
      label: 'Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('navigate', '/dashboard');
        }
      },
    },
    {
      label: 'POS',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('navigate', '/pos');
        }
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Notifications',
      submenu: [
        {
          label: 'Show All Notifications',
          click: () => {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.focus();
              mainWindow.webContents.send('navigate', '/notifications');
            }
          },
        },
        {
          type: 'separator',
        },
        {
          label: 'Enable Notifications',
          type: 'checkbox',
          checked: true,
          click: (menuItem) => {
            mainWindow?.webContents.send('toggle-notifications', menuItem.checked);
          },
        },
      ],
    },
    {
      type: 'separator',
    },
    {
      label: 'About',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('show-about');
        }
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

/**
 * Show notification balloon (Windows)
 */
export function showTrayNotification(title: string, body: string): void {
  if (tray) {
    tray.displayBalloon({
      title,
      content: body,
      icon: nativeImage.createEmpty(),
    });
  }
}

/**
 * Update tray tooltip
 */
export function updateTrayTooltip(text: string): void {
  if (tray) {
    tray.setToolTip(text);
  }
}

/**
 * Destroy tray
 */
export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
    console.log('🗑️  System tray destroyed');
  }
}

/**
 * Get tray instance
 */
export function getTray(): Tray | null {
  return tray;
}




