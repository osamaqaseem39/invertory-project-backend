#!/bin/bash

# Electron Desktop App Launcher
# This script starts the Inventory Management System as a desktop application

echo "🚀 Starting Inventory Management Desktop App..."
echo ""

# Check if backend is running
echo "📡 Checking backend server (http://localhost:8000)..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend server is running"
else
    echo "⚠️  Backend server is NOT running on http://localhost:8000"
    echo "   Please start the backend first:"
    echo "   cd .. && npm run start:server"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if frontend is running (for development)
echo "📱 Checking frontend server (http://localhost:3000)..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend dev server is running"
    MODE="development"
else
    echo "ℹ️  Frontend dev server not running - will use production build"
    MODE="production"
fi

echo ""
echo "🖥️  Launching Electron app in $MODE mode..."
echo ""

# Build and run
cd "$(dirname "$0")"
npm run build && NODE_ENV=$MODE npm run dev

echo ""
echo "✅ Electron app closed"




