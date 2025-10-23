import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface Config {
  env: string;
  port: number;
  apiVersion: string;
  database: {
    url: string;
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiry: string;
    refreshExpiry: string;
  };
  bootstrap: {
    enabled: boolean;
    token: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    authMax: number;
  };
  logging: {
    level: string;
  };
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  
  database: {
    url: process.env.DATABASE_URL || '',
  },
  
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key-change-in-production-min-32-chars',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production-min-32-chars',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  
  bootstrap: {
    enabled: process.env.BOOTSTRAP_ENABLED === 'true',
    token: process.env.BOOTSTRAP_TOKEN || 'bootstrap-secret-token-change-me',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5', 10),
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Validation
if (!config.database.url) {
  throw new Error('DATABASE_URL must be defined in environment variables');
}

if (config.jwt.accessSecret.length < 32) {
  console.warn('⚠️  JWT_ACCESS_SECRET should be at least 32 characters for production');
}

if (config.jwt.refreshSecret.length < 32) {
  console.warn('⚠️  JWT_REFRESH_SECRET should be at least 32 characters for production');
}

export default config;





