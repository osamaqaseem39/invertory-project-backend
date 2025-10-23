# Building Production Installers

This guide explains how to build production-ready installers for all platforms.

## Prerequisites

### General
- Node.js 18+ installed
- npm or yarn
- Backend and frontend built

### Platform-Specific

**Windows:**
- Windows 7+ (for building Windows installers)
- Or use Wine on macOS/Linux (not recommended)

**macOS:**
- macOS 10.13+ (for building macOS installers)
- Xcode Command Line Tools: `xcode-select --install`
- Apple Developer ID (for code signing)

**Linux:**
- Ubuntu 18.04+ or similar (for building Linux packages)
- `fpm` and `rpm` tools for DEB/RPM packages

## Quick Start

### 1. Prepare Frontend

```bash
cd /Users/mbgrao/Documents/110ct
npm run build  # Build React frontend
```

### 2. Build Electron App

```bash
cd electron
npm run build  # Compile TypeScript
```

### 3. Package for Current Platform

```bash
# Package for current platform only
npm run package

# Or specific platform:
npm run package:win    # Windows
npm run package:mac    # macOS
npm run package:linux  # Linux

# Or all platforms (requires platform dependencies):
npm run package:all
```

## Output

Installers will be created in `electron/dist-electron/`:

### Windows
- `Inventory Management System-1.0.0-win-x64.exe` (NSIS installer)
- `Inventory Management System-1.0.0-win-ia32.exe` (32-bit)

### macOS
- `Inventory Management System-1.0.0-mac-x64.dmg` (Intel)
- `Inventory Management System-1.0.0-mac-arm64.dmg` (Apple Silicon)
- `Inventory Management System-1.0.0-mac-universal.dmg` (Universal)

### Linux
- `Inventory Management System-1.0.0-linux-x64.AppImage`

## Code Signing

### Windows Code Signing

1. Obtain a Windows code signing certificate
2. Convert to `.pfx` format
3. Set environment variables:

```bash
export CSC_LINK=/path/to/certificate.pfx
export CSC_KEY_PASSWORD=your_password
```

4. Build with signing:

```bash
npm run package:win
```

### macOS Code Signing

1. Obtain Apple Developer ID certificate
2. Install certificate in Keychain
3. Set environment variables:

```bash
export CSC_NAME="Developer ID Application: Your Name (TEAM_ID)"
export APPLE_ID=your@apple.id
export APPLE_ID_PASSWORD=app-specific-password
```

4. Build with signing:

```bash
npm run package:mac
```

**Note:** macOS apps must be notarized for distribution outside Mac App Store.

### Notarization (macOS)

After building, notarize the app:

```bash
xcrun notarytool submit \
  "dist-electron/Inventory Management System-1.0.0.dmg" \
  --apple-id "your@apple.id" \
  --password "app-specific-password" \
  --team-id "TEAM_ID" \
  --wait

xcrun stapler staple "dist-electron/Inventory Management System-1.0.0.dmg"
```

## Configuration

### Update App Version

Edit `package.json`:

```json
{
  "version": "1.0.0"
}
```

### Update App Metadata

Edit `package.json` → `build` section:

```json
{
  "build": {
    "appId": "com.inventory.app",
    "productName": "Inventory Management System",
    "copyright": "Copyright © 2025"
  }
}
```

### Custom Icons

Replace placeholder icons in `build-resources/`:
- `icon.ico` - Windows icon
- `icon.icns` - macOS icon
- `linux/icon.png` - Linux icon

See `build-resources/README.md` for icon requirements.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Installers

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm install
          cd electron && npm install
      
      - name: Build frontend
        run: npm run build
      
      - name: Build Electron app
        run: cd electron && npm run build
      
      - name: Package
        run: cd electron && npm run package
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-installer
          path: electron/dist-electron/*
```

## Troubleshooting

### "Command failed: wine"
- Install Wine on macOS/Linux to build Windows installers
- Or build on actual Windows machine

### "Code signing failed"
- Verify certificate is installed
- Check environment variables
- Ensure certificate hasn't expired

### "Build failed: ENOENT frontend/dist"
- Build frontend first: `npm run build`
- Check frontend build output path

### "Icon not found"
- Ensure icons exist in `build-resources/`
- Check icon file formats (.ico, .icns, .png)

### Large installer size
- Check `asar: true` in package.json
- Remove unnecessary files
- Use `compression: "maximum"`

## Testing Installers

### Windows
1. Run the `.exe` installer
2. Verify desktop shortcut created
3. Test app functionality
4. Check Start Menu entry
5. Test uninstaller

### macOS
1. Open the `.dmg` file
2. Drag to Applications
3. Right-click and "Open" (first launch)
4. Test app functionality
5. Check Launchpad entry

### Linux
1. Make AppImage executable: `chmod +x *.AppImage`
2. Run: `./Inventory*.AppImage`
3. Test app functionality

## Distribution

### Direct Download
- Upload installers to your website
- Provide download links by platform

### Auto-Updates
1. Upload installers to update server
2. Update `latest.yml` (Linux), `latest-mac.yml` (macOS), or `latest.yml` (Windows)
3. Configure `publish` in package.json

### App Stores
- **Microsoft Store**: Requires APPX package
- **Mac App Store**: Requires separate build with MAS entitlements
- **Snap Store**: Convert AppImage to Snap

## Next Steps

1. ✅ Build installers for all platforms
2. ✅ Test on clean machines
3. ✅ Setup code signing
4. ✅ Configure auto-updates
5. ✅ Create distribution channels
6. ✅ Document installation process for users

## Resources

- [electron-builder docs](https://www.electron.build/)
- [Code signing guide](https://www.electron.build/code-signing)
- [Auto-update guide](https://www.electron.build/auto-update)
- [macOS notarization](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)




