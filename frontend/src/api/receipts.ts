import apiClient from './client';

export interface ReceiptData {
  business_name: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  tax_id?: string;
  receipt_number: string;
  transaction_number: string;
  transaction_date: string;
  cashier_name: string;
  customer?: {
    name: string;
    customer_number: string;
  };
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    discount_percentage: number;
    line_total: number;
    tax_amount?: number;
  }>;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  total: number;
  payment_method: string;
  amount_tendered: number;
  change_amount: number;
  coupon_code?: string;
  loyalty_points_earned?: number;
  header_text?: string;
  footer_text?: string;
  return_policy?: string;
  qr_code_data?: string;
  barcode_data?: string;
}

export interface Receipt {
  id: string;
  receipt_number: string;
  transaction_id: string;
  receipt_data: ReceiptData;
  status: string;
  printed_at?: string;
  emailed_at?: string;
  email_address?: string;
  reprint_count: number;
  last_reprinted_at?: string;
  created_at: string;
}

export const receiptsAPI = {
  async generateReceipt(transactionId: string): Promise<{ receipt: Receipt; receipt_data: ReceiptData }> {
    const response = await apiClient.post('/receipts/generate', {
      transaction_id: transactionId,
    });
    return response.data.data;
  },

  async reprintReceipt(receiptId: string): Promise<{ receipt: Receipt; receipt_data: ReceiptData }> {
    const response = await apiClient.post('/receipts/reprint', {
      receipt_id: receiptId,
    });
    return response.data.data;
  },

  async getReceiptByTransaction(transactionId: string): Promise<{ receipt: Receipt; receipt_data: ReceiptData } | null> {
    const response = await apiClient.get(`/receipts/transaction/${transactionId}`);
    return response.data.data;
  },

  async getReceiptByNumber(receiptNumber: string): Promise<{ receipt: Receipt; receipt_data: ReceiptData }> {
    const response = await apiClient.get(`/receipts/number/${receiptNumber}`);
    return response.data.data;
  },

  async emailReceipt(receiptId: string, emailAddress: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/receipts/email', {
      receipt_id: receiptId,
      email_address: emailAddress,
    });
    return response.data.data;
  },

  async getReceiptHTML(receiptId: string): Promise<string> {
    const response = await apiClient.get(`/receipts/html/${receiptId}`, {
      responseType: 'text',
    });
    return response.data;
  },
};

export default receiptsAPI;





