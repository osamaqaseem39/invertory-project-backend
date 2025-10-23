import apiClient from './client';
import { User, UserRole, PaginatedResponse, UserStatistics } from '../types';

export interface CreateUserDTO {
  username: string;
  email: string;
  display_name: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserDTO {
  username?: string;
  email?: string;
  display_name?: string;
  role?: UserRole;
}

export const usersAPI = {
  list: async (params?: {
    role?: UserRole;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  create: async (data: CreateUserDTO): Promise<{ message: string; user: User }> => {
    const response = await apiClient.post('/users', data);
    return response.data;
  },

  update: async (id: string, data: UpdateUserDTO): Promise<{ message: string; user: User }> => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },

  updateStatus: async (
    id: string,
    isActive: boolean
  ): Promise<{ message: string; user: User }> => {
    const response = await apiClient.patch(`/users/${id}/status`, { is_active: isActive });
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },

  getStatistics: async (): Promise<UserStatistics> => {
    const response = await apiClient.get('/users/stats');
    return response.data;
  },
};





