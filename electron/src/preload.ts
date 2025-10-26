import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Secure storage
  storeSecureData: (key: string, value: any) => ipcRenderer.invoke('store-secure-data', key, value),
  getSecureData: (key: string) => ipcRenderer.invoke('get-secure-data', key),
  deleteSecureData: (key: string) => ipcRenderer.invoke('delete-secure-data', key),
  clearAllData: () => ipcRenderer.invoke('clear-all-data'),

  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // Window actions
  quitApp: () => ipcRenderer.invoke('quit-app'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('toggle-maximize-window'),

  // Dialogs
  showError: (title: string, message: string) => ipcRenderer.invoke('show-error', title, message),
  showMessage: (options: any) => ipcRenderer.invoke('show-message', options),

  // Logging
  logMessage: (message: string, level: 'info' | 'warn' | 'error') =>
    ipcRenderer.invoke('log-message', message, level),

  // Language support
  setLanguage: (language: 'en' | 'ar') => ipcRenderer.invoke('set-language', language),
  getLanguage: () => ipcRenderer.invoke('get-language'),
  onLanguageChanged: (callback: (language: 'en' | 'ar') => void) => {
    ipcRenderer.on('language-changed', (_event: any, language: any) => callback(language));
  },
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      storeSecureData: (key: string, value: any) => Promise<{ success: boolean; error?: string }>;
      getSecureData: (key: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      deleteSecureData: (key: string) => Promise<{ success: boolean; error?: string }>;
      clearAllData: () => Promise<{ success: boolean; error?: string }>;
      getAppVersion: () => Promise<string>;
      getAppInfo: () => Promise<any>;
      quitApp: () => Promise<void>;
      minimizeWindow: () => Promise<void>;
      toggleMaximizeWindow: () => Promise<void>;
      showError: (title: string, message: string) => Promise<{ success: boolean }>;
      showMessage: (options: any) => Promise<any>;
      logMessage: (message: string, level: 'info' | 'warn' | 'error') => Promise<{ success: boolean }>;
      
      // Language support
      setLanguage: (language: 'en' | 'ar') => Promise<{ success: boolean; error?: string }>;
      getLanguage: () => Promise<{ success: boolean; language?: 'en' | 'ar'; error?: string }>;
      onLanguageChanged: (callback: (language: 'en' | 'ar') => void) => void;
    };
  }
}

console.log('🔒 Preload script loaded - Secure IPC bridge active');
console.log('✅ Electron API available with Arabic language support');