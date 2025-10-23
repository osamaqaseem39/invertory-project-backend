# Build Resources

This directory contains assets and resources for building production installers.

## Directory Structure

```
build-resources/
├── icon.png          # Master icon (1024x1024 PNG)
├── icon.icns         # macOS icon bundle
├── icon.ico          # Windows icon
├── background.png    # DMG background (macOS)
├── installer.nsi     # NSIS installer script (Windows)
└── linux/            # Linux-specific resources
    └── icon.png      # Linux icon
```

## Icon Requirements

### macOS (.icns)
- Must contain multiple sizes: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
- Generated from master 1024x1024 PNG

### Windows (.ico)
- Must contain multiple sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
- Generated from master 1024x1024 PNG

### Linux (.png)
- Typically 512x512 or 1024x1024 PNG

## Generating Icons

### macOS (using iconutil)
```bash
# Create iconset directory
mkdir icon.iconset

# Generate all required sizes
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png

# Convert to .icns
iconutil -c icns icon.iconset
```

### Windows (using ImageMagick or online tool)
```bash
# Using ImageMagick
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### Online Tools
- https://cloudconvert.com/png-to-icns
- https://cloudconvert.com/png-to-ico
- https://iconverticons.com/online/

## Background Image (macOS DMG)

- Size: 540x380 pixels (or 1080x760 for Retina)
- Format: PNG with transparency
- Shows during DMG installation

## Notes

- **Production**: Replace placeholder icons with actual branded icons
- **Trademark**: Ensure you have rights to use any logos/images
- **Testing**: Test installers on actual target OS versions




