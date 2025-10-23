import { z } from 'zod';

// ===== CASH MANAGEMENT VALIDATORS =====

export const createCashEventSchema = z.object({
  session_id: z.string().uuid(),
  type: z.enum(['PAID_IN', 'PAID_OUT', 'NO_SALE', 'CASH_DROP', 'PETTY_CASH']),
  amount: z.number().positive().optional(),
  reason: z.string().min(3).max(500),
  reference: z.string().max(100).optional(),
});

export const generateZReportSchema = z.object({
  session_id: z.string().uuid(),
});

// ===== DISCOUNT & OVERRIDE VALIDATORS =====

export const validateDiscountSchema = z.object({
  user_id: z.string().uuid(),
  discount_percentage: z.number().min(0).max(100),
  discount_type: z.enum(['line', 'cart']),
});

export const requestOverrideSchema = z.object({
  session_id: z.string().uuid(),
  override_type: z.enum(['DISCOUNT', 'PRICE_CHANGE', 'VOID', 'REFUND']),
  reason_code: z.string().min(2).max(50),
  reason_detail: z.string().max(500).optional(),
  metadata: z.any().optional(),
});

export const approveOverrideSchema = z.object({
  approver_username: z.string().min(3),
  approver_pin: z.string().min(4),
  session_id: z.string().uuid(),
  override_type: z.string(),
  reason_code: z.string(),
  reason_detail: z.string().optional(),
  metadata: z.any().optional(),
  requesting_user_id: z.string().uuid().optional(),
});

// ===== RETURNS & EXCHANGES VALIDATORS =====

export const lookupSaleSchema = z.object({
  transaction_number: z.string().optional(),
  barcode: z.string().optional(),
}).refine(data => data.transaction_number || data.barcode, {
  message: 'Either transaction_number or barcode is required',
});

export const processRefundSchema = z.object({
  transaction_id: z.string().uuid(),
  items: z.array(z.object({
    item_id: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  refund_method: z.enum(['ORIGINAL_PAYMENT', 'CASH', 'STORE_CREDIT', 'GIFT_CARD']),
  reason: z.string().min(3).max(500),
});

export const processExchangeSchema = z.object({
  original_transaction_id: z.string().uuid(),
  return_items: z.array(z.object({
    item_id: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  new_items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().positive(),
    unit_price: z.number().positive(),
    discount_percentage: z.number().min(0).max(100).optional(),
  })).min(1),
  session_id: z.string().uuid(),
  payment_method: z.string(),
});

// ===== PRICE BOOKS & COUPONS VALIDATORS =====

export const createPriceBookSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['BASE', 'PROMOTIONAL', 'SEASONAL', 'CLEARANCE']),
  priority: z.number().int().min(0).optional(),
  start_at: z.string().datetime().optional(),
  end_at: z.string().datetime().optional(),
  store_id: z.string().uuid().optional(),
  terminal_id: z.string().uuid().optional(),
});

export const addPriceBookItemSchema = z.object({
  price_book_id: z.string().uuid(),
  product_id: z.string().uuid(),
  promo_price: z.number().min(0),
  start_at: z.string().datetime().optional(),
  end_at: z.string().datetime().optional(),
});

export const createCouponSchema = z.object({
  code: z.string().min(3).max(50).regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens'),
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['PERCENT', 'FLAT']),
  value: z.number().positive(),
  min_purchase_amount: z.number().min(0).optional(),
  max_discount_amount: z.number().min(0).optional(),
  max_uses: z.number().int().positive().optional(),
  per_customer_limit: z.number().int().positive().optional(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
});

export const applyCouponSchema = z.object({
  code: z.string().min(3).max(50),
  subtotal: z.number().min(0),
  customer_id: z.string().uuid().optional(),
});

// ===== CUSTOMER & CREDIT VALIDATORS =====

export const quickAddCustomerSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
});

export const addStoreCreditSchema = z.object({
  customer_id: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().min(3).max(500),
  transaction_id: z.string().uuid().optional(),
});

export const useStoreCreditSchema = z.object({
  customer_id: z.string().uuid(),
  amount: z.number().positive(),
  transaction_id: z.string().uuid(),
});

export const issueGiftCardSchema = z.object({
  amount: z.number().positive(),
  customer_id: z.string().uuid().optional(),
  expires_at: z.string().datetime().optional(),
});

export const redeemGiftCardSchema = z.object({
  code: z.string().min(10).max(50),
  amount: z.number().positive(),
});

export const checkGiftCardBalanceSchema = z.object({
  code: z.string().min(10).max(50),
});

// ===== PLU & BARCODE VALIDATORS =====

export const addBarcodeAliasSchema = z.object({
  product_id: z.string().uuid(),
  barcode: z.string().min(1).max(64),
  description: z.string().max(200).optional(),
});

export const addPLUCodeSchema = z.object({
  product_id: z.string().uuid(),
  plu_code: z.string().min(1).max(20),
  is_weighted: z.boolean().optional(),
  price_per_unit: z.number().positive().optional(),
});

export const searchByPLUSchema = z.object({
  plu_code: z.string().min(1).max(20),
});

export const calculateWeightedPriceSchema = z.object({
  plu_code: z.string().min(1).max(20),
  weight: z.number().positive(),
});

// ===== REPORTING VALIDATORS =====

const baseDateRangeSchema = z.object({
  date_from: z.string().datetime(),
  date_to: z.string().datetime(),
});

export const dateRangeQuerySchema = baseDateRangeSchema.refine(
  data => new Date(data.date_from) <= new Date(data.date_to), 
  { message: 'date_from must be before or equal to date_to' }
);

export const topItemsQuerySchema = baseDateRangeSchema.extend({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
}).refine(
  data => new Date(data.date_from) <= new Date(data.date_to),
  { message: 'date_from must be before or equal to date_to' }
);

export const discountLeakageQuerySchema = baseDateRangeSchema.extend({
  by_cashier: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
}).refine(
  data => new Date(data.date_from) <= new Date(data.date_to),
  { message: 'date_from must be before or equal to date_to' }
);

export const salesByHourQuerySchema = z.object({
  date: z.string().datetime(),
});

// ===== TYPE EXPORTS =====

export type CreateCashEventDTO = z.infer<typeof createCashEventSchema>;
export type ValidateDiscountDTO = z.infer<typeof validateDiscountSchema>;
export type RequestOverrideDTO = z.infer<typeof requestOverrideSchema>;
export type ApproveOverrideDTO = z.infer<typeof approveOverrideSchema>;
export type LookupSaleDTO = z.infer<typeof lookupSaleSchema>;
export type ProcessRefundDTO = z.infer<typeof processRefundSchema>;
export type ProcessExchangeDTO = z.infer<typeof processExchangeSchema>;
export type CreatePriceBookDTO = z.infer<typeof createPriceBookSchema>;
export type CreateCouponDTO = z.infer<typeof createCouponSchema>;
export type QuickAddCustomerDTO = z.infer<typeof quickAddCustomerSchema>;
export type IssueGiftCardDTO = z.infer<typeof issueGiftCardSchema>;

