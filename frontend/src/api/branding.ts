import axios from 'axios';

const API_URL = 'http://localhost:4000/api/v1';

export interface BrandingProfile {
  id: string;
  company_name: string;
  company_name_ar?: string;
  tagline?: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  business_website?: string;
  tax_id?: string;
  logo_original?: string;
  logo_header?: string;
  logo_receipt?: string;
  logo_pdf?: string;
  logo_email?: string;
  logo_thumbnail?: string;
  logo_base64?: string;
  favicon_32?: string;
  favicon_16?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  success_color: string;
  warning_color: string;
  error_color: string;
  color_palette?: any;
  font_family: string;
  theme_mode: string;
  generated_css?: string;
  css_version: number;
  receipt_header_text?: string;
  receipt_footer_text?: string;
  receipt_logo_position: string;
  receipt_logo_size: number;
  show_logo_on_receipt: boolean;
  invoice_template: string;
  invoice_header_color?: string;
  invoice_watermark?: string;
  show_watermark: boolean;
  watermark_opacity: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description?: string;
  preview_image?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  is_builtin: boolean;
  is_public: boolean;
  usage_count: number;
  created_at: string;
}

export interface CreateBrandingData {
  company_name: string;
  company_name_ar?: string;
  tagline?: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  business_website?: string;
  tax_id?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  success_color?: string;
  warning_color?: string;
  error_color?: string;
  font_family?: string;
  theme_mode?: string;
  receipt_header_text?: string;
  receipt_footer_text?: string;
  receipt_logo_position?: string;
  invoice_template?: string;
  invoice_watermark?: string;
  show_watermark?: boolean;
}

const brandingAPI = {
  /**
   * Get active branding profile (public)
   */
  getActiveBranding: async () => {
    const response = await axios.get(`${API_URL}/branding/active`);
    return response.data.data;
  },

  /**
   * List all branding profiles (admin)
   */
  listBrandings: async (token: string) => {
    const response = await axios.get(`${API_URL}/branding`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  /**
   * Create branding profile (admin)
   */
  createBranding: async (token: string, data: CreateBrandingData) => {
    const response = await axios.post(`${API_URL}/branding`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  /**
   * Update branding profile (admin)
   */
  updateBranding: async (token: string, id: string, data: Partial<CreateBrandingData>) => {
    const response = await axios.patch(`${API_URL}/branding/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  /**
   * Upload logo (admin)
   */
  uploadLogo: async (token: string, id: string, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await axios.post(`${API_URL}/branding/${id}/logo`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * Set branding as active (admin)
   */
  activateBranding: async (token: string, id: string) => {
    const response = await axios.post(`${API_URL}/branding/${id}/activate`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  /**
   * Delete branding profile (admin)
   */
  deleteBranding: async (token: string, id: string) => {
    const response = await axios.delete(`${API_URL}/branding/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  /**
   * Generate theme CSS (admin)
   */
  generateCSS: async (token: string, id: string) => {
    const response = await axios.post(`${API_URL}/branding/${id}/generate-css`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  /**
   * Get all theme presets (public)
   */
  getThemePresets: async () => {
    const response = await axios.get(`${API_URL}/branding/theme-presets`);
    return response.data.data;
  },

  /**
   * Create custom theme preset (admin)
   */
  createThemePreset: async (token: string, data: {
    name: string;
    description?: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
  }) => {
    const response = await axios.post(`${API_URL}/branding/theme-presets`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  /**
   * Apply theme preset (admin)
   */
  applyThemePreset: async (token: string, profileId: string, presetId: string) => {
    const response = await axios.post(
      `${API_URL}/branding/${profileId}/apply-preset`,
      { presetId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.data;
  },

  /**
   * Seed built-in themes (admin)
   */
  seedThemes: async (token: string) => {
    const response = await axios.post(`${API_URL}/branding/theme-presets/seed`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * Get receipt branding preview (public)
   */
  getReceiptBranding: async () => {
    const response = await axios.get(`${API_URL}/branding/receipt-preview`);
    return response.data.data;
  },
};

export default brandingAPI;





