import { z } from 'zod';

// Upload document schema
export const uploadDocumentSchema = z.object({
  sourceType: z.enum(['RECEIPT', 'INVOICE', 'PURCHASE_ORDER', 'PRICE_LIST']),
  sourceReference: z.string().optional(),
});

// List scans query schema
export const listScansQuerySchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVIEWED']).optional(),
  sourceType: z.enum(['RECEIPT', 'INVOICE', 'PURCHASE_ORDER', 'PRICE_LIST']).optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
});

// Correct product schema
export const correctProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sku: z.string().min(1).max(100).optional(),
  price: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

// Bulk add products schema
export const bulkAddProductsSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1),
});

// File validation
export const validateFile = (file: Express.Multer.File | undefined) => {
  if (!file) {
    throw new Error('No file uploaded');
  }

  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size exceeds 10MB limit');
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPG, PNG, and PDF are allowed');
  }

  return file;
};





