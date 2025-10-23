import apiClient from './client';

export interface PrintSettings {
  id: string;
  store_id?: string;
  terminal_id?: string;
  business_name: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  tax_id?: string;
  header_text?: string;
  footer_text?: string;
  return_policy?: string;
  print_logo: boolean;
  logo_url?: string;
  print_barcode: boolean;
  print_qr_code: boolean;
  paper_width: number;
  font_size: number;
  show_tax_breakdown: boolean;
  show_cashier_name: boolean;
  show_customer_info: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const printSettingsAPI = {
  async getPrintSettings(id?: string): Promise<PrintSettings> {
    const response = await apiClient.get('/settings/print', {
      params: id ? { id } : undefined,
    });
    return response.data.data;
  },

  async updatePrintSettings(id: string, data: Partial<PrintSettings>): Promise<PrintSettings> {
    const response = await apiClient.put(`/settings/print/${id}`, data);
    return response.data.data;
  },
};

export default printSettingsAPI;





