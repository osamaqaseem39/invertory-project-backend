import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().min(1).max(64).regex(/^[a-zA-Z0-9-_]+$/, 'SKU can only contain letters, numbers, hyphens, and underscores'),
  barcode: z.string().max(64).optional().nullable(),
  name: z.string().min(2).max(120),
  description: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable().transform(val => val === '' ? null : val),
  stock_quantity: z.number().int().min(0).optional().default(0),
  reorder_level: z.number().int().min(0).optional().default(0),
  reorder_quantity: z.number().int().min(0).optional().default(0),
  max_stock_level: z.number().int().min(0).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  price: z.number().min(0),
  cost: z.number().min(0).optional().nullable(),
  uom: z.string().max(16).default('unit'),
  images: z.array(z.object({
    url: z.string().url(),
    is_primary: z.boolean().optional(),
  })).max(5).optional().default([]),
}).refine(
  (data) => !data.cost || !data.price || data.cost <= data.price,
  {
    message: 'Cost should not exceed price',
    path: ['cost'],
  }
);

export const updateProductSchema = z.object({
  sku: z.string().min(1).max(64).regex(/^[a-zA-Z0-9-_]+$/).optional(),
  barcode: z.string().max(64).optional().nullable(),
  name: z.string().min(2).max(120).optional(),
  description: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable().transform(val => val === '' ? null : val),
  stock_quantity: z.number().int().min(0).optional(),
  reorder_level: z.number().int().min(0).optional(),
  reorder_quantity: z.number().int().min(0).optional(),
  max_stock_level: z.number().int().min(0).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  price: z.number().min(0).optional(),
  cost: z.number().min(0).optional().nullable(),
  uom: z.string().max(16).optional(),
  is_active: z.boolean().optional(),
  images: z.array(z.object({
    url: z.string().url(),
    is_primary: z.boolean().optional(),
  })).max(5).optional().default([]),
}).refine(
  (data) => !data.cost || !data.price || data.cost <= data.price,
  {
    message: 'Cost should not exceed price',
    path: ['cost'],
  }
);

export const listProductsQuerySchema = z.object({
  q: z.string().optional(), // Search query
  category_id: z.string().uuid().optional(),
  brand: z.string().optional(),
  is_archived: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  is_active: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  limit: z.string().optional().transform(val => parseInt(val || '20', 10)),
  sort: z.enum(['name', 'sku', 'price', 'created_at', '-name', '-sku', '-price', '-created_at']).optional().default('created_at'),
});

export type CreateProductDTO = z.infer<typeof createProductSchema>;
export type UpdateProductDTO = z.infer<typeof updateProductSchema>;
export type ListProductsQueryDTO = z.infer<typeof listProductsQuerySchema>;

