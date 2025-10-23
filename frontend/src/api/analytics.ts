import apiClient from './client';

export interface SalesAnalytics {
  overview: {
    total_sales: number;
    total_transactions: number;
    average_transaction: number;
    total_customers: number;
    unique_customers: number;
  };
  trends: {
    sales_growth_percentage: number;
    transaction_growth_percentage: number;
    best_day: { date: string; sales: number };
    worst_day: { date: string; sales: number };
  };
  payment_methods: Record<string, {
    total: number;
    count: number;
    percentage: number;
  }>;
  hourly_distribution: Array<{
    hour: number;
    sales: number;
    transactions: number;
  }>;
  top_products: Array<{
    product_id: string;
    product_name: string;
    sku: string;
    quantity_sold: number;
    revenue: number;
    profit?: number;
  }>;
  cashier_performance: Array<{
    cashier_id: string;
    cashier_name: string;
    total_sales: number;
    transactions_count: number;
    average_transaction: number;
    total_discounts: number;
  }>;
}

export interface DashboardStats {
  today: { sales: number; transactions: number };
  this_week: { sales: number; transactions: number };
  this_month: { sales: number; transactions: number };
  active_sessions: number;
  low_stock_count: number;
}

export interface SalesTrend {
  period: string;
  sales: number;
  transactions: number;
  average: number;
}

export interface ProductPerformance {
  product_id: string;
  product_name: string;
  sku: string;
  barcode: string;
  category: string;
  quantity_sold: number;
  revenue: number;
  cost: number;
  profit: number;
  profit_margin: number;
  transactions_count: number;
}

export interface CategoryPerformance {
  category_id: string;
  category_name: string;
  revenue: number;
  items_sold: number;
  transactions_count: number;
}

export const analyticsAPI = {
  async getSalesAnalytics(dateFrom: string, dateTo: string): Promise<SalesAnalytics> {
    const response = await apiClient.post('/analytics/sales', {
      date_from: dateFrom,
      date_to: dateTo,
    });
    return response.data.data;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data.data;
  },

  async getSalesTrend(
    dateFrom: string,
    dateTo: string,
    period: 'hour' | 'day' | 'week' | 'month'
  ): Promise<SalesTrend[]> {
    const response = await apiClient.get('/analytics/trend', {
      params: {
        date_from: dateFrom,
        date_to: dateTo,
        period,
      },
    });
    return response.data.data;
  },

  async getProductPerformance(dateFrom: string, dateTo: string): Promise<ProductPerformance[]> {
    const response = await apiClient.get('/analytics/products', {
      params: {
        date_from: dateFrom,
        date_to: dateTo,
      },
    });
    return response.data.data;
  },

  async getCategoryPerformance(dateFrom: string, dateTo: string): Promise<CategoryPerformance[]> {
    const response = await apiClient.get('/analytics/categories', {
      params: {
        date_from: dateFrom,
        date_to: dateTo,
      },
    });
    return response.data.data;
  },
};

export default analyticsAPI;





