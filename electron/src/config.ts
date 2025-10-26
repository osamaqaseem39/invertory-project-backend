/**
 * Application Configuration
 * Centralized configuration for the Electron app
 */

export interface AppConfig {
  backend: {
    local: string;
    deployed: string;
    current: string;
  };
  app: {
    name: string;
    version: string;
    description: string;
  };
  window: {
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
  };
}

export const config: AppConfig = {
  backend: {
    local: 'http://localhost:4000',
    deployed: 'https://user-management-system-65uw.onrender.com',
    current: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:4000' 
      : 'https://user-management-system-65uw.onrender.com'
  },
  app: {
    name: 'Inventory Management System',
    version: '1.0.0',
    description: 'Desktop application for inventory management with Arabic language support'
  },
  window: {
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700
  }
};

export default config;