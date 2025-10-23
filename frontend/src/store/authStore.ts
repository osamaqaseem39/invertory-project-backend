import { create } from 'zustand';
import { User, Permissions } from '../types';
import { authAPI } from '../api/auth';

interface AuthState {
  user: User | null;
  permissions: Permissions | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  loadPermissions: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  permissions: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (identifier: string, password: string) => {
    const response = await authAPI.login(identifier, password);
    
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    
    set({
      user: response.user,
      isAuthenticated: true,
    });

    // Load permissions after login
    await get().loadPermissions();
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      try {
        await authAPI.logout(refreshToken);
      } catch (error) {
        console.error('Logout API call failed:', error);
      }
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    set({
      user: null,
      permissions: null,
      isAuthenticated: false,
    });
  },

  loadUser: async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const user = await authAPI.getCurrentUser();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      await get().loadPermissions();
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  loadPermissions: async () => {
    try {
      const permissions = await authAPI.getPermissions();
      set({ permissions });
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  },
}));





