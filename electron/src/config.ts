/**
 * Electron App Configuration
 * Centralized configuration management
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

export const config = {
  // Backend API
  backend: {
    url: process.env.BACKEND_URL || 'http://localhost:8000',
    healthEndpoint: process.env.BACKEND_HEALTH_ENDPOINT || '/health',
    timeout: 10000, // 10 seconds
  },

  // Frontend
  frontend: {
    devUrl: process.env.FRONTEND_DEV_URL || 'http://localhost:3000',
    prodPath: '../../frontend/dist/index.html',
  },

  // Environment
  env: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // Security
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || 'change-this-key-in-production',
  },

  // Window Configuration
  window: {
    width: parseInt(process.env.WINDOW_WIDTH || '1400'),
    height: parseInt(process.env.WINDOW_HEIGHT || '900'),
    minWidth: parseInt(process.env.WINDOW_MIN_WIDTH || '1200'),
    minHeight: parseInt(process.env.WINDOW_MIN_HEIGHT || '700'),
    backgroundColor: '#667eea',
  },

  // Developer Options
  devTools: {
    enabled: process.env.ENABLE_DEVTOOLS === 'true',
    autoOpen: process.env.AUTO_OPEN_DEVTOOLS === 'true',
  },

  // App Metadata
  app: {
    name: 'Inventory Management System',
    version: '1.0.0',
    author: 'Your Company',
  },
};

export default config;




