# Inventory Management System - Working Executable Builder
# PowerShell Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Inventory Management System" -ForegroundColor Yellow
Write-Host "  Working Executable Builder" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Join-Path $scriptDir ".."
$frontendDir = Join-Path $projectRoot "frontend"
$electronDir = $scriptDir

Write-Host "Building frontend..." -ForegroundColor Yellow
Set-Location $frontendDir

if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: Frontend package.json not found" -ForegroundColor Red
    Write-Host "Please ensure the frontend directory exists" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Build frontend
Write-Host "Building React frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Frontend built successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "Building Electron app..." -ForegroundColor Yellow
Set-Location $electronDir

# Build TypeScript
Write-Host "Compiling TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: TypeScript compilation failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "TypeScript compiled successfully!" -ForegroundColor Green
Write-Host ""

# Try to build with electron-builder but skip code signing
Write-Host "Attempting to build executable..." -ForegroundColor Yellow
Write-Host "Note: If this fails due to permissions, we'll create a portable version instead." -ForegroundColor Yellow
Write-Host ""

# Set environment variable to skip code signing
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"

# Try building
npm run package:win
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Electron-builder failed due to permissions. Creating portable version..." -ForegroundColor Yellow
    Write-Host ""
    
    # Create portable version
    if (Test-Path "portable-dist") {
        Remove-Item -Recurse -Force "portable-dist"
    }
    New-Item -ItemType Directory -Name "portable-dist" | Out-Null
    
    # Copy Electron runtime
    Copy-Item -Recurse -Force "node_modules\electron\dist" "portable-dist\electron"
    
    # Copy application files
    New-Item -ItemType Directory -Name "portable-dist\app" | Out-Null
    Copy-Item -Recurse -Force "dist" "portable-dist\app\"
    Copy-Item -Recurse -Force "..\frontend\dist" "portable-dist\app\frontend"
    Copy-Item "package.json" "portable-dist\app\"
    
    # Create launcher
    $launcherContent = @"
@echo off
cd /d "%~dp0"
electron\electron.exe app\main.js
"@
    $launcherContent | Out-File -FilePath "portable-dist\Inventory Management System.bat" -Encoding ASCII
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  PORTABLE VERSION CREATED!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Portable executable created in: portable-dist\" -ForegroundColor Green
    Write-Host ""
    Write-Host "To run the application:" -ForegroundColor Yellow
    Write-Host "1. Navigate to portable-dist folder" -ForegroundColor White
    Write-Host "2. Double-click 'Inventory Management System.bat'" -ForegroundColor White
    Write-Host ""
    Write-Host "This is a portable version that doesn't require installation." -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  INSTALLER CREATED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Installer created in: dist-electron\" -ForegroundColor Green
    Write-Host ""
    Write-Host "Files created:" -ForegroundColor Yellow
    Get-ChildItem "dist-electron\*.exe" | ForEach-Object { Write-Host "  $($_.Name)" -ForegroundColor White }
    Write-Host ""
    Write-Host "You can now distribute the installer to users." -ForegroundColor Green
    Write-Host ""
}

Read-Host "Press Enter to exit"
