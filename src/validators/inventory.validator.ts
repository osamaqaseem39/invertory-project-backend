import { z } from 'zod';
import { POStatus, StockMovementType, AdjustmentReason, AdjustmentStatus } from '@prisma/client';

// ===== CATEGORY VALIDATORS =====

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  parent_id: z.string().uuid().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const listCategoriesQuerySchema = z.object({
  parent_id: z.string().uuid().optional(),
  is_active: z.enum(['true', 'false']).optional().transform(val => val ? val === 'true' : undefined),
});

// ===== SUPPLIER VALIDATORS =====

export const createSupplierSchema = z.object({
  name: z.string().min(2).max(200),
  contact_person: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  address: z.string().optional(),
  tax_id: z.string().max(50).optional(),
  payment_terms: z.string().max(50).optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const listSuppliersQuerySchema = z.object({
  q: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional().transform(val => val ? val === 'true' : undefined),
});

// ===== PURCHASE ORDER VALIDATORS =====

export const createPOItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  unit_price: z.number().min(0),
});

export const createPOSchema = z.object({
  supplier_id: z.string().uuid(),
  expected_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(createPOItemSchema).min(1),
});

export const updatePOSchema = z.object({
  supplier_id: z.string().uuid().optional(),
  expected_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(createPOItemSchema).optional(),
});

export const listPOsQuerySchema = z.object({
  supplier_id: z.string().uuid().optional(),
  status: z.nativeEnum(POStatus).optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  limit: z.string().optional().transform(val => parseInt(val || '10', 10)),
});

// ===== GOODS RECEIPT (GRN) VALIDATORS =====

export const createGRNItemSchema = z.object({
  po_item_id: z.string().uuid(),
  product_id: z.string().uuid(),
  expected_quantity: z.number().int().min(0),
  received_quantity: z.number().int().min(0),
  damaged_quantity: z.number().int().min(0).default(0),
  notes: z.string().optional(),
});

export const createGRNSchema = z.object({
  po_id: z.string().uuid(),
  received_date: z.string(),
  notes: z.string().optional(),
  items: z.array(createGRNItemSchema).min(1),
});

export const listGRNsQuerySchema = z.object({
  po_id: z.string().uuid().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  limit: z.string().optional().transform(val => parseInt(val || '10', 10)),
});

// ===== STOCK ADJUSTMENT VALIDATORS =====

export const createStockAdjustmentSchema = z.object({
  product_id: z.string().uuid(),
  new_quantity: z.number().int().min(0),
  reason: z.nativeEnum(AdjustmentReason),
  notes: z.string().optional(),
});

export const approveAdjustmentSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
});

export const listAdjustmentsQuerySchema = z.object({
  product_id: z.string().uuid().optional(),
  status: z.nativeEnum(AdjustmentStatus).optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  limit: z.string().optional().transform(val => parseInt(val || '10', 10)),
});

// ===== STOCK MOVEMENT VALIDATORS =====

export const listMovementsQuerySchema = z.object({
  product_id: z.string().uuid().optional(),
  movement_type: z.nativeEnum(StockMovementType).optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  limit: z.string().optional().transform(val => parseInt(val || '10', 10)),
});

// ===== TYPE EXPORTS =====

export type CreateCategoryDTO = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDTO = z.infer<typeof updateCategorySchema>;
export type CreateSupplierDTO = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierDTO = z.infer<typeof updateSupplierSchema>;
export type CreatePODTO = z.infer<typeof createPOSchema>;
export type UpdatePODTO = z.infer<typeof updatePOSchema>;
export type CreateGRNDTO = z.infer<typeof createGRNSchema>;
export type CreateStockAdjustmentDTO = z.infer<typeof createStockAdjustmentSchema>;
export type ApproveAdjustmentDTO = z.infer<typeof approveAdjustmentSchema>;

