import apiClient from './client';
import { Product, PaginatedResponse, ProductStatistics } from '../types';

export interface CreateProductDTO {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  brand?: string;
  category?: string;
  price: number;
  cost?: number;
  uom?: string;
  images?: Array<{url: string; is_primary?: boolean}>;
}

export interface UpdateProductDTO {
  sku?: string;
  barcode?: string;
  name?: string;
  description?: string;
  brand?: string;
  category?: string;
  price?: number;
  cost?: number;
  uom?: string;
  is_active?: boolean;
  images?: Array<{url: string; is_primary?: boolean}>;
}

export const productsAPI = {
  list: async (params?: {
    q?: string;
    category?: string;
    brand?: string;
    is_archived?: boolean;
    is_active?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  create: async (data: CreateProductDTO): Promise<{ message: string; product: Product }> => {
    const response = await apiClient.post('/products', data);
    return response.data;
  },

  update: async (id: string, data: UpdateProductDTO): Promise<{ message: string; product: Product }> => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },

  archive: async (id: string): Promise<{ message: string; product: Product }> => {
    const response = await apiClient.patch(`/products/${id}/archive`);
    return response.data;
  },

  restore: async (id: string): Promise<{ message: string; product: Product }> => {
    const response = await apiClient.patch(`/products/${id}/restore`);
    return response.data;
  },

  getStatistics: async (): Promise<ProductStatistics> => {
    const response = await apiClient.get('/products/stats');
    return response.data;
  },
};





