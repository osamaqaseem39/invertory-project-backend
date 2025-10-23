import apiClient from './client';
import { Category, Supplier, PurchaseOrder, StockAdjustment, StockMovement } from '../types';

export const inventoryAPI = {
  // ===== CATEGORIES =====
  async createCategory(data: { name: string; description?: string; parent_id?: string }) {
    const response = await apiClient.post('/inventory/categories', data);
    return response.data as Category;
  },

  async listCategories(params?: { parent_id?: string; is_active?: boolean }) {
    const response = await apiClient.get('/inventory/categories', { params });
    return response.data;
  },

  async getCategoryById(id: string) {
    const response = await apiClient.get(`/inventory/categories/${id}`);
    return response.data as Category;
  },

  async updateCategory(id: string, data: { name?: string; description?: string; parent_id?: string; sort_order?: number }) {
    const response = await apiClient.patch(`/inventory/categories/${id}`, data);
    return response.data as Category;
  },

  async deleteCategory(id: string) {
    await apiClient.delete(`/inventory/categories/${id}`);
  },

  // ===== SUPPLIERS =====
  async createSupplier(data: {
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    tax_id?: string;
    payment_terms?: string;
  }) {
    const response = await apiClient.post('/inventory/suppliers', data);
    return response.data as Supplier;
  },

  async listSuppliers(params?: { q?: string; is_active?: boolean }) {
    const response = await apiClient.get('/inventory/suppliers', { params });
    return response.data.data as Supplier[];
  },

  async getSupplierById(id: string) {
    const response = await apiClient.get(`/inventory/suppliers/${id}`);
    return response.data as Supplier;
  },

  async updateSupplier(id: string, data: Partial<Supplier>) {
    const response = await apiClient.patch(`/inventory/suppliers/${id}`, data);
    return response.data as Supplier;
  },

  // ===== PURCHASE ORDERS =====
  async createPurchaseOrder(data: {
    supplier_id: string;
    expected_date?: string;
    notes?: string;
    items: Array<{ product_id: string; quantity: number; unit_price: number }>;
  }) {
    const response = await apiClient.post('/inventory/purchase-orders', data);
    return response.data as PurchaseOrder;
  },

  async listPurchaseOrders(params?: {
    supplier_id?: string;
    status?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/inventory/purchase-orders', { params });
    return response.data;
  },

  async getPurchaseOrderById(id: string) {
    const response = await apiClient.get(`/inventory/purchase-orders/${id}`);
    return response.data as PurchaseOrder;
  },

  async approvePurchaseOrder(id: string) {
    const response = await apiClient.post(`/inventory/purchase-orders/${id}/approve`);
    return response.data as PurchaseOrder;
  },

  // ===== STOCK ADJUSTMENTS =====
  async createStockAdjustment(data: {
    product_id: string;
    new_quantity: number;
    reason: string;
    notes?: string;
  }) {
    const response = await apiClient.post('/inventory/stock-adjustments', data);
    return response.data as StockAdjustment;
  },

  async listStockAdjustments(params?: {
    product_id?: string;
    status?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/inventory/stock-adjustments', { params });
    return response.data;
  },

  async approveStockAdjustment(id: string, approved: boolean, notes?: string) {
    const response = await apiClient.post(`/inventory/stock-adjustments/${id}/approve`, { approved, notes });
    return response.data as StockAdjustment;
  },

  // ===== STOCK MOVEMENTS & REPORTS =====
  async listStockMovements(params?: {
    product_id?: string;
    movement_type?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/inventory/stock-movements', { params });
    return response.data;
  },

  async getLowStockProducts() {
    const response = await apiClient.get('/inventory/low-stock');
    return response.data.data as Product[];
  },

  async getInventoryStats() {
    const response = await apiClient.get('/inventory/stats');
    return response.data;
  },
};

