import apiClient from './client';
import {
  Customer,
  SalesOrder,
  Invoice,
  Payment,
  POSSession,
  POSTransaction,
  SalesStatistics,
  PaymentMethod,
  SalesOrderStatus,
  POSSessionStatus,
} from '../types';

// ===== CUSTOMER API =====

export const customerAPI = {
  async create(customerData: Partial<Customer>) {
    const response = await apiClient.post('/sales/customers', customerData);
    return response.data.data;
  },

  async list(params?: {
    q?: string;
    is_active?: boolean;
    is_vip?: boolean;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/sales/customers', { params });
    return response.data;
  },

  async getById(id: string): Promise<Customer> {
    const response = await apiClient.get(`/sales/customers/${id}`);
    return response.data.data;
  },

  async update(id: string, customerData: Partial<Customer>): Promise<Customer> {
    const response = await apiClient.put(`/sales/customers/${id}`, customerData);
    return response.data.data;
  },
};

// ===== SALES ORDER API =====

export const salesOrderAPI = {
  async create(orderData: {
    customer_id: string;
    required_date?: string;
    shipping_address?: string;
    notes?: string;
    items: {
      product_id: string;
      quantity: number;
      unit_price?: number;
      discount_percentage?: number;
    }[];
  }): Promise<SalesOrder> {
    const response = await apiClient.post('/sales/sales-orders', orderData);
    return response.data.data;
  },

  async list(params?: {
    customer_id?: string;
    status?: SalesOrderStatus;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/sales/sales-orders', { params });
    return response.data;
  },

  async getById(id: string): Promise<SalesOrder> {
    const response = await apiClient.get(`/sales/sales-orders/${id}`);
    return response.data.data;
  },

  async update(id: string, orderData: {
    status?: SalesOrderStatus;
    required_date?: string;
    shipping_address?: string;
    notes?: string;
  }): Promise<SalesOrder> {
    const response = await apiClient.put(`/sales/sales-orders/${id}`, orderData);
    return response.data.data;
  },
};

// ===== POS API =====

export const posAPI = {
  async startSession(startingCash: number): Promise<POSSession> {
    const response = await apiClient.post('/sales/pos/sessions', {
      starting_cash: startingCash,
    });
    return response.data.data;
  },

  async listSessions(params?: {
    cashier_id?: string;
    status?: POSSessionStatus;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/sales/pos/sessions', { params });
    return response.data;
  },

  async getSessionById(id: string): Promise<POSSession> {
    const response = await apiClient.get(`/sales/pos/sessions/${id}`);
    return response.data.data;
  },

  async endSession(id: string, endingCash: number): Promise<POSSession> {
    const response = await apiClient.post(`/sales/pos/sessions/${id}/end`, {
      ending_cash: endingCash,
    });
    return response.data.data;
  },

  async processTransaction(transactionData: {
    session_id: string;
    transaction_type: 'SALE' | 'RETURN' | 'REFUND';
    customer_id?: string;
    items: {
      product_id: string;
      quantity: number;
      unit_price: number;
      discount_percentage?: number;
    }[];
    payment_method: PaymentMethod;
    amount_tendered: number;
    notes?: string;
  }): Promise<POSTransaction> {
    const response = await apiClient.post('/sales/pos/transactions', transactionData);
    return response.data.data;
  },
};

// ===== INVOICE API =====

export const invoiceAPI = {
  async create(invoiceData: {
    sales_order_id?: string;
    customer_id: string;
    due_date: string;
    notes?: string;
    terms?: string;
    items: {
      product_id: string;
      quantity: number;
      unit_price: number;
      discount_percentage?: number;
    }[];
  }): Promise<Invoice> {
    const response = await apiClient.post('/sales/invoices', invoiceData);
    return response.data.data;
  },

  async processPayment(paymentData: {
    invoice_id: string;
    amount: number;
    payment_method: PaymentMethod;
    reference_number?: string;
    notes?: string;
  }): Promise<Payment> {
    const response = await apiClient.post('/sales/payments', paymentData);
    return response.data.data;
  },
};

// ===== SALES STATISTICS API =====

export const salesAPI = {
  async getStatistics(): Promise<SalesStatistics> {
    const response = await apiClient.get('/sales/statistics');
    return response.data.data;
  },

  // Re-export all APIs for convenience
  customers: customerAPI,
  salesOrders: salesOrderAPI,
  pos: posAPI,
  invoices: invoiceAPI,
};

export default salesAPI;




