/**
 * Electron Utility Functions
 * Connection checking, health monitoring, and helper utilities
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

/**
 * Check if a URL is accessible
 */
export async function checkUrlAccessible(url: string, timeout = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      const req = client.get(url, { timeout }, (res) => {
        resolve(res.statusCode !== undefined && res.statusCode < 500);
        req.destroy();
      });

      req.on('error', () => {
        resolve(false);
        req.destroy();
      });

      req.on('timeout', () => {
        resolve(false);
        req.destroy();
      });
    } catch (error) {
      resolve(false);
    }
  });
}

/**
 * Check backend health
 */
export async function checkBackendHealth(backendUrl: string): Promise<{
  isHealthy: boolean;
  statusCode?: number;
  error?: string;
}> {
  try {
    const healthUrl = `${backendUrl}/health`;
    const isAccessible = await checkUrlAccessible(healthUrl);

    if (!isAccessible) {
      return {
        isHealthy: false,
        error: 'Backend server is not responding',
      };
    }

    return { isHealthy: true, statusCode: 200 };
  } catch (error) {
    return {
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check frontend availability
 */
export async function checkFrontendAvailable(frontendUrl: string): Promise<boolean> {
  return await checkUrlAccessible(frontendUrl);
}

/**
 * Get connection status for all services
 */
export async function getConnectionStatus(backendUrl: string, frontendUrl: string) {
  const [backend, frontend] = await Promise.all([
    checkBackendHealth(backendUrl),
    checkFrontendAvailable(frontendUrl),
  ]);

  return {
    backend,
    frontend: {
      isAvailable: frontend,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries reached');
}




