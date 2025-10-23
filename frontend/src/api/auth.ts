import apiClient from './client';
import { AuthResponse, User } from '../types';

export const authAPI = {
  login: async (identifier: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', { identifier, password });
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refresh_token: refreshToken });
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/me');
    return response.data;
  },

  getPermissions: async () => {
    const response = await apiClient.get('/me/permissions');
    return response.data;
  },
};





