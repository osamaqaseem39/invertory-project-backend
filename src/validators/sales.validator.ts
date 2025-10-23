import { z } from 'zod';

// ===== CUSTOMER VALIDATORS =====

export const createCustomerSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().max(50, 'Phone number too long').optional().or(z.literal('')),
  address_line1: z.string().max(255, 'Address too long').optional().or(z.literal('')),
  address_line2: z.string().max(255, 'Address too long').optional().or(z.literal('')),
  city: z.string().max(100, 'City name too long').optional().or(z.literal('')),
  state: z.string().max(100, 'State name too long').optional().or(z.literal('')),
  postal_code: z.string().max(20, 'Postal code too long').optional().or(z.literal('')),
  country: z.string().max(100, 'Country name too long').optional().or(z.literal('')),
  company_name: z.string().max(200, 'Company name too long').optional().or(z.literal('')),
  tax_id: z.string().max(50, 'Tax ID too long').optional().or(z.literal('')),
  credit_limit: z.number().min(0, 'Credit limit must be non-negative').optional(),
  payment_terms: z.string().max(50, 'Payment terms too long').optional().or(z.literal('')),
  discount_percentage: z.number().min(0, 'Discount percentage must be non-negative').max(100, 'Discount percentage cannot exceed 100%').optional(),
  is_vip: z.boolean().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  is_active: z.boolean().optional(),
});

export const listCustomersQuerySchema = z.object({
  q: z.string().optional(),
  is_active: z.string().optional().transform((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }),
  is_vip: z.string().optional().transform((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }),
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
});

// ===== SALES ORDER VALIDATORS =====

export const createSalesOrderSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  required_date: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  shipping_address: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    unit_price: z.number().min(0, 'Unit price must be non-negative').optional(),
    discount_percentage: z.number().min(0, 'Discount percentage must be non-negative').max(100, 'Discount percentage cannot exceed 100%').optional(),
  })).min(1, 'At least one item is required'),
});

export const updateSalesOrderSchema = z.object({
  status: z.enum(['DRAFT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']).optional(),
  required_date: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  shipping_address: z.string().optional(),
  notes: z.string().optional(),
});

export const listSalesOrdersQuerySchema = z.object({
  customer_id: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']).optional(),
  date_from: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  date_to: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
});

// ===== INVOICE VALIDATORS =====

export const createInvoiceSchema = z.object({
  sales_order_id: z.string().uuid('Invalid sales order ID').optional(),
  customer_id: z.string().uuid('Invalid customer ID'),
  due_date: z.string().datetime('Invalid due date format'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    unit_price: z.number().min(0, 'Unit price must be non-negative'),
    discount_percentage: z.number().min(0, 'Discount percentage must be non-negative').max(100, 'Discount percentage cannot exceed 100%').optional(),
  })).min(1, 'At least one item is required'),
});

export const processPaymentSchema = z.object({
  invoice_id: z.string().uuid('Invalid invoice ID'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  payment_method: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CHECK', 'STORE_CREDIT', 'OTHER']),
  reference_number: z.string().max(100, 'Reference number too long').optional(),
  notes: z.string().optional(),
});

// ===== POS VALIDATORS =====

export const startPOSSessionSchema = z.object({
  starting_cash: z.number().min(0, 'Starting cash must be non-negative'),
});

export const endPOSSessionSchema = z.object({
  ending_cash: z.number().min(0, 'Ending cash must be non-negative'),
});

export const processPOSTransactionSchema = z.object({
  session_id: z.string().uuid('Invalid session ID'),
  transaction_type: z.enum(['SALE', 'RETURN', 'REFUND']),
  customer_id: z.string().uuid('Invalid customer ID').optional(),
  items: z.array(z.object({
    product_id: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    unit_price: z.number().min(0, 'Unit price must be non-negative'),
    discount_percentage: z.number().min(0, 'Discount percentage must be non-negative').max(100, 'Discount percentage cannot exceed 100%').optional(),
  })).min(1, 'At least one item is required'),
  payment_method: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CHECK', 'STORE_CREDIT', 'OTHER']),
  amount_tendered: z.number().min(0, 'Amount tendered must be non-negative'),
  notes: z.string().optional(),
});

export const listPOSSessionsQuerySchema = z.object({
  cashier_id: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'CLOSED', 'SUSPENDED']).optional(),
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
});

// ===== RETURN VALIDATORS =====

export const createReturnSchema = z.object({
  sales_order_id: z.string().uuid('Invalid sales order ID').optional(),
  transaction_id: z.string().uuid('Invalid transaction ID').optional(),
  customer_id: z.string().uuid('Invalid customer ID'),
  reason: z.enum(['DEFECTIVE', 'WRONG_ITEM', 'NOT_AS_DESCRIBED', 'CHANGED_MIND', 'DUPLICATE_ORDER', 'OTHER']),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    unit_price: z.number().min(0, 'Unit price must be non-negative'),
    condition: z.enum(['NEW', 'USED', 'DAMAGED']),
  })).min(1, 'At least one item is required'),
});

export const listReturnsQuerySchema = z.object({
  customer_id: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED']).optional(),
  date_from: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  date_to: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
});




