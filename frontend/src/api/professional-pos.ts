import apiClient from './client';
import {
  CashEvent,
  CashEventType,
  ZReportData,
  DiscountCaps,
  ManagerOverride,
  POSTransaction,
  PriceBook,
  PriceBookItem,
  Coupon,
  GiftCard,
  StoreCreditLedger,
  BarcodeAlias,
  PLUCode,
  Customer,
  DiscountType,
  PricebookType,
  RefundMethod,
} from '../types';

// ===== CASH MANAGEMENT API =====

export const cashManagementAPI = {
  async createCashEvent(data: {
    session_id: string;
    type: CashEventType;
    amount?: number;
    reason: string;
    reference?: string;
  }): Promise<CashEvent> {
    const response = await apiClient.post('/professional-pos/cash-events', data);
    return response.data.data;
  },

  async getCashEvents(sessionId: string): Promise<CashEvent[]> {
    const response = await apiClient.get(`/professional-pos/cash-events/${sessionId}`);
    return response.data.data;
  },

  async generateZReport(sessionId: string): Promise<ZReportData> {
    const response = await apiClient.get(`/professional-pos/reports/z-report/${sessionId}`);
    return response.data.data;
  },

  async generateXReport(sessionId: string): Promise<ZReportData> {
    const response = await apiClient.get(`/professional-pos/reports/x-report/${sessionId}`);
    return response.data.data;
  },
};

// ===== DISCOUNT & OVERRIDE API =====

export const discountOverrideAPI = {
  async getDiscountCaps(): Promise<DiscountCaps> {
    const response = await apiClient.get('/professional-pos/discounts/caps');
    return response.data.data;
  },

  async validateDiscount(data: {
    user_id: string;
    discount_percentage: number;
    discount_type: 'line' | 'cart';
  }): Promise<{
    allowed: boolean;
    requires_override: boolean;
    max_allowed: number;
  }> {
    const response = await apiClient.post('/professional-pos/discounts/validate', data);
    return response.data.data;
  },

  async approveOverride(data: {
    approver_username: string;
    approver_pin: string;
    session_id: string;
    override_type: string;
    reason_code: string;
    reason_detail?: string;
    metadata?: any;
  }): Promise<ManagerOverride> {
    const response = await apiClient.post('/professional-pos/overrides/approve', data);
    return response.data.data;
  },

  async getOverrides(sessionId: string): Promise<ManagerOverride[]> {
    const response = await apiClient.get(`/professional-pos/overrides/${sessionId}`);
    return response.data.data;
  },
};

// ===== RETURNS & EXCHANGES API =====

export const returnsExchangesAPI = {
  async lookupSale(data: {
    transaction_number?: string;
    barcode?: string;
  }): Promise<POSTransaction> {
    const response = await apiClient.post('/professional-pos/sales/lookup', data);
    return response.data.data;
  },

  async processRefund(data: {
    transaction_id: string;
    items: Array<{ item_id: string; quantity: number }>;
    refund_method: RefundMethod;
    reason: string;
  }): Promise<POSTransaction> {
    const response = await apiClient.post('/professional-pos/sales/refund', data);
    return response.data.data;
  },

  async processExchange(data: {
    original_transaction_id: string;
    return_items: Array<{ item_id: string; quantity: number }>;
    new_items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      discount_percentage?: number;
    }>;
    session_id: string;
    payment_method: string;
  }): Promise<POSTransaction> {
    const response = await apiClient.post('/professional-pos/sales/exchange', data);
    return response.data.data;
  },
};

// ===== PRICE BOOKS & COUPONS API =====

export const priceBookAPI = {
  async create(data: {
    name: string;
    description?: string;
    type: PricebookType;
    priority?: number;
    start_at?: string;
    end_at?: string;
    store_id?: string;
    terminal_id?: string;
  }): Promise<PriceBook> {
    const response = await apiClient.post('/professional-pos/price-books', data);
    return response.data.data;
  },

  async list(): Promise<PriceBook[]> {
    const response = await apiClient.get('/professional-pos/price-books');
    return response.data.data;
  },

  async getActive(storeId?: string, terminalId?: string): Promise<PriceBook | null> {
    const response = await apiClient.get('/professional-pos/price-books/active', {
      params: { store_id: storeId, terminal_id: terminalId },
    });
    return response.data.data;
  },

  async addItem(data: {
    price_book_id: string;
    product_id: string;
    promo_price: number;
    start_at?: string;
    end_at?: string;
  }): Promise<PriceBookItem> {
    const response = await apiClient.post('/professional-pos/price-books/items', data);
    return response.data.data;
  },
};

export const couponAPI = {
  async create(data: {
    code: string;
    name: string;
    description?: string;
    type: DiscountType;
    value: number;
    min_purchase_amount?: number;
    max_discount_amount?: number;
    max_uses?: number;
    per_customer_limit?: number;
    start_at: string;
    end_at: string;
  }): Promise<Coupon> {
    const response = await apiClient.post('/professional-pos/coupons', data);
    return response.data.data;
  },

  async list(): Promise<Coupon[]> {
    const response = await apiClient.get('/professional-pos/coupons');
    return response.data.data;
  },

  async apply(data: {
    code: string;
    subtotal: number;
    customer_id?: string;
  }): Promise<{
    valid: boolean;
    discount_amount: number;
    message?: string;
  }> {
    const response = await apiClient.post('/professional-pos/coupons/apply', data);
    return response.data.data;
  },
};

// ===== CUSTOMER & CREDIT API =====

export const customerCreditAPI = {
  async quickAdd(data: {
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
  }): Promise<Customer> {
    const response = await apiClient.post('/professional-pos/customers/quick-add', data);
    return response.data.data;
  },

  async addStoreCredit(customerId: string, data: {
    amount: number;
    reason: string;
    transaction_id?: string;
  }): Promise<{ customer: Customer; ledger_entry: StoreCreditLedger }> {
    const response = await apiClient.post(
      `/professional-pos/customers/${customerId}/store-credit`,
      data
    );
    return response.data.data;
  },

  async useStoreCredit(customerId: string, data: {
    amount: number;
    transaction_id: string;
  }): Promise<{ customer: Customer; ledger_entry: StoreCreditLedger }> {
    const response = await apiClient.post(
      `/professional-pos/customers/${customerId}/store-credit/use`,
      data
    );
    return response.data.data;
  },

  async getStoreCreditBalance(customerId: string): Promise<number> {
    const response = await apiClient.get(
      `/professional-pos/customers/${customerId}/store-credit`
    );
    return response.data.data.balance;
  },

  async getStoreCreditHistory(customerId: string): Promise<StoreCreditLedger[]> {
    const response = await apiClient.get(
      `/professional-pos/customers/${customerId}/store-credit/history`
    );
    return response.data.data;
  },
};

export const giftCardAPI = {
  async issue(data: {
    amount: number;
    customer_id?: string;
    expires_at?: string;
  }): Promise<GiftCard> {
    const response = await apiClient.post('/professional-pos/gift-cards', data);
    return response.data.data;
  },

  async redeem(data: {
    code: string;
    amount: number;
  }): Promise<{
    gift_card: GiftCard;
    redeemed_amount: number;
    remaining_balance: number;
  }> {
    const response = await apiClient.post('/professional-pos/gift-cards/redeem', data);
    return response.data.data;
  },

  async checkBalance(code: string): Promise<{
    balance: number;
    is_active: boolean;
    is_expired: boolean;
  }> {
    const response = await apiClient.post('/professional-pos/gift-cards/check-balance', { code });
    return response.data.data;
  },
};

// ===== PLU & BARCODE API =====

export const pluBarcodeAPI = {
  async addBarcodeAlias(data: {
    product_id: string;
    barcode: string;
    description?: string;
  }): Promise<BarcodeAlias> {
    const response = await apiClient.post('/professional-pos/products/barcode-aliases', data);
    return response.data.data;
  },

  async getProductAliases(productId: string): Promise<BarcodeAlias[]> {
    const response = await apiClient.get(`/professional-pos/products/${productId}/barcode-aliases`);
    return response.data.data;
  },

  async addPLUCode(data: {
    product_id: string;
    plu_code: string;
    is_weighted?: boolean;
    price_per_unit?: number;
  }): Promise<PLUCode> {
    const response = await apiClient.post('/professional-pos/products/plu-codes', data);
    return response.data.data;
  },

  async searchByPLU(plu_code: string): Promise<PLUCode | null> {
    const response = await apiClient.post('/professional-pos/products/search-by-plu', { plu_code });
    return response.data.data;
  },

  async calculateWeightedPrice(data: {
    plu_code: string;
    weight: number;
  }): Promise<{
    product: any;
    weight: number;
    price_per_unit: number;
    total_price: number;
  }> {
    const response = await apiClient.post('/professional-pos/products/calculate-weighted-price', data);
    return response.data.data;
  },
};

// ===== REPORTING API =====

export const posReportsAPI = {
  async getTopItems(params: {
    date_from: string;
    date_to: string;
    limit?: number;
  }): Promise<Array<{
    product_id: string;
    product_name: string;
    sku: string;
    quantity_sold: number;
    total_revenue: number;
    transactions_count: number;
  }>> {
    const response = await apiClient.get('/professional-pos/reports/top-items', { params });
    return response.data.data;
  },

  async getDiscountLeakage(params: {
    date_from: string;
    date_to: string;
    by_cashier?: boolean;
  }): Promise<any> {
    const response = await apiClient.get('/professional-pos/reports/discount-leakage', { params });
    return response.data.data;
  },

  async getSalesByHour(date: string): Promise<Array<{
    hour: number;
    sales: number;
    transactions: number;
  }>> {
    const response = await apiClient.get('/professional-pos/reports/sales-by-hour', {
      params: { date },
    });
    return response.data.data;
  },

  async getSalesSummary(params: {
    date_from: string;
    date_to: string;
  }): Promise<{
    period: { from: string; to: string };
    sales: { total: number; count: number; average_transaction: number };
    refunds: { total: number; count: number; rate_percentage: number };
    net_sales: number;
    by_payment_method: Record<string, { total: number; count: number }>;
  }> {
    const response = await apiClient.get('/professional-pos/reports/sales-summary', { params });
    return response.data.data;
  },
};

// ===== COMBINED EXPORT =====

export const professionalPOSAPI = {
  cashManagement: cashManagementAPI,
  discountOverride: discountOverrideAPI,
  returnsExchanges: returnsExchangesAPI,
  priceBooks: priceBookAPI,
  coupons: couponAPI,
  customerCredit: customerCreditAPI,
  giftCards: giftCardAPI,
  pluBarcode: pluBarcodeAPI,
  reports: posReportsAPI,
};

export default professionalPOSAPI;





