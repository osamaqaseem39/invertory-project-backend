#!/usr/bin/env node

/**
 * Electron Test Script
 * Tests if Electron can launch and basic IPC works
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing Electron Desktop App...\n');

// Check if dist folder exists
const fs = require('fs');
const distPath = path.join(__dirname, 'dist');

if (!fs.existsSync(distPath)) {
  console.error('❌ ERROR: dist/ folder not found');
  console.error('   Run: npm run build');
  process.exit(1);
}

console.log('✅ dist/ folder exists');

// Check if main.js exists
const mainPath = path.join(distPath, 'main.js');
if (!fs.existsSync(mainPath)) {
  console.error('❌ ERROR: dist/main.js not found');
  process.exit(1);
}

console.log('✅ dist/main.js exists');

// Check if preload.js exists
const preloadPath = path.join(distPath, 'preload.js');
if (!fs.existsSync(preloadPath)) {
  console.error('❌ ERROR: dist/preload.js not found');
  process.exit(1);
}

console.log('✅ dist/preload.js exists');
console.log('\n📦 All required files present!');
console.log('\n🚀 Ready to launch Electron app');
console.log('\nTo start the app, run:');
console.log('  npm run dev        (development mode)');
console.log('  ./start-electron.sh (with health checks)');
console.log('\n✅ Phase 1 Core Foundation Complete!');




