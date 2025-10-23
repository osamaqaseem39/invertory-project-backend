import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface OCRScan {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  source_type: 'RECEIPT' | 'INVOICE' | 'PURCHASE_ORDER' | 'PRICE_LIST';
  source_reference?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REVIEWED';
  raw_text?: string;
  confidence_score?: number;
  processing_time?: number;
  error_message?: string;
  vendor_name?: string;
  document_date?: string;
  document_total?: number;
  currency?: string;
  products_count: number;
  uploaded_by_id: string;
  reviewed_by_id?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  uploaded_by?: {
    id: string;
    username: string;
    display_name: string;
  };
  reviewed_by?: {
    id: string;
    username: string;
    display_name: string;
  };
  products?: OCRProduct[];
  _count?: {
    products: number;
  };
}

export interface OCRProduct {
  id: string;
  scan_id: string;
  raw_text: string;
  line_number: number;
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  matched_product_id?: string;
  confidence_score?: number;
  is_reviewed: boolean;
  is_approved: boolean;
  is_added_to_inventory: boolean;
  corrected_name?: string;
  corrected_sku?: string;
  corrected_price?: number;
  correction_notes?: string;
  created_at: string;
  updated_at: string;
  matched_product?: {
    id: string;
    name: string;
    sku: string;
    barcode?: string;
    price: number;
  };
}

export interface OCRProcessingResult {
  scanId: string;
  status: 'COMPLETED' | 'FAILED';
  productsExtracted: number;
  confidenceScore: number;
  processingTime: number;
  errorMessage?: string;
}

export const ocrAPI = {
  // Upload document
  uploadDocument: async (
    file: File,
    sourceType: 'RECEIPT' | 'INVOICE' | 'PURCHASE_ORDER' | 'PRICE_LIST',
    sourceReference?: string
  ): Promise<{ data: OCRScan }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sourceType', sourceType);
    if (sourceReference) {
      formData.append('sourceReference', sourceReference);
    }

    const response = await api.post<{ data: OCRScan }>('/ocr/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Process scan
  processScan: async (scanId: string): Promise<{ data: OCRProcessingResult }> => {
    const response = await api.post<{ data: OCRProcessingResult }>(`/ocr/scans/${scanId}/process`);
    return response.data;
  },

  // List scans
  listScans: async (params?: {
    status?: string;
    sourceType?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: OCRScan[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> => {
    const response = await api.get('/ocr/scans', { params });
    return response.data;
  },

  // Get scan by ID
  getScanById: async (scanId: string): Promise<{ data: OCRScan }> => {
    const response = await api.get<{ data: OCRScan }>(`/ocr/scans/${scanId}`);
    return response.data;
  },

  // Review scan
  reviewScan: async (scanId: string): Promise<{ data: OCRScan }> => {
    const response = await api.patch<{ data: OCRScan }>(`/ocr/scans/${scanId}/review`);
    return response.data;
  },

  // Delete scan
  deleteScan: async (scanId: string): Promise<{ data: OCRScan }> => {
    const response = await api.delete<{ data: OCRScan }>(`/ocr/scans/${scanId}`);
    return response.data;
  },

  // Approve product
  approveProduct: async (productId: string): Promise<{ data: OCRProduct }> => {
    const response = await api.post<{ data: OCRProduct }>(`/ocr/products/${productId}/approve`);
    return response.data;
  },

  // Correct product
  correctProduct: async (
    productId: string,
    corrections: {
      name?: string;
      sku?: string;
      price?: number;
      notes?: string;
    }
  ): Promise<{ data: OCRProduct }> => {
    const response = await api.patch<{ data: OCRProduct }>(`/ocr/products/${productId}/correct`, corrections);
    return response.data;
  },

  // Add product to inventory
  addProductToInventory: async (productId: string): Promise<{ data: any }> => {
    const response = await api.post(`/ocr/products/${productId}/add`);
    return response.data;
  },

  // Bulk add products
  bulkAddProducts: async (productIds: string[]): Promise<{
    data: {
      added: string[];
      failed: { id: string; error: string }[];
    };
  }> => {
    const response = await api.post('/ocr/products/bulk-add', { productIds });
    return response.data;
  },
};

// Product image upload
export const productImageAPI = {
  uploadImage: async (productId: string, file: File): Promise<{ data: any }> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post(`/products/${productId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteImage: async (productId: string, imageId: string): Promise<{ data: any }> => {
    const response = await api.delete(`/products/${productId}/images/${imageId}`);
    return response.data;
  },
};





