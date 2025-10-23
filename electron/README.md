# 🖥️ Electron Desktop App

This is the Electron desktop wrapper for the **Inventory Management System**.

## ✅ Features

- ✅ **Secure IPC**: Context isolation enabled, no nodeIntegration
- ✅ **Encrypted Storage**: Tokens and sensitive data stored securely with electron-store
- ✅ **Auto Updates**: Scaffold ready (requires configuration)
- ✅ **Cross-Platform**: Windows (NSIS), macOS (DMG), Linux (AppImage)
- ✅ **Native Desktop**: Full window management, system tray, keyboard shortcuts

## 🚀 Quick Start

### Prerequisites

1. **Backend** must be running on `http://localhost:8000`
2. **Frontend** must be running on `http://localhost:3000` (for development)

### Option 1: Easy Launch (Recommended)

```bash
./start-electron.sh
```

This script will:
- Check if backend/frontend are running
- Build TypeScript files
- Launch Electron app automatically

### Option 2: Manual Launch

```bash
cd electron
npm install
npm run dev
```

This will:
1. Compile TypeScript to JavaScript
2. Launch Electron with DevTools
3. Load from React dev server (http://localhost:3000)

## Production Build

### 1. Build Frontend First

```bash
cd ../frontend
npm run build
```

### 2. Build Electron App

```bash
cd ../electron
npm run build
npm run package
```

Output will be in `dist-electron/`:
- Windows: `User Management System Setup.exe`
- macOS: `User Management System.dmg`
- Linux: `User Management System.AppImage`

## Secure IPC API

The preload script exposes these secure methods to the renderer:

### Storage
```typescript
window.electronAPI.storeSecureData(key: string, value: any)
window.electronAPI.getSecureData(key: string)
window.electronAPI.deleteSecureData(key: string)
```

### App Info
```typescript
window.electronAPI.getAppVersion()
window.electronAPI.getAppPath()
```

### Actions
```typescript
window.electronAPI.quitApp()
window.electronAPI.logMessage(message: string, level: 'info' | 'warn' | 'error')
```

## Security

- **No Node Integration**: Renderer process has no access to Node.js
- **Context Isolation**: Enabled to prevent prototype pollution
- **Encrypted Storage**: `electron-store` with encryption for tokens
- **CSP Ready**: Content Security Policy can be added in production

## Configuration

Edit `package.json` build section for packaging options:
- Change `appId`
- Configure code signing (requires certificates)
- Add auto-update server URL

## Auto-Update (TODO)

To enable auto-updates:
1. Set up update server (electron-update-server or S3)
2. Add code signing certificates
3. Uncomment auto-updater code in `main.ts`

## TODO

- [ ] Add code signing for Windows/macOS
- [ ] Configure auto-update server
- [ ] Add custom app icon
- [ ] Add native notifications
- [ ] Add system tray support


