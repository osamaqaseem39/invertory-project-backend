import { z } from 'zod';

// ===== RECEIPT VALIDATORS =====

export const generateReceiptSchema = z.object({
  transaction_id: z.string().uuid('Invalid transaction ID'),
  print_settings_id: z.string().uuid('Invalid print settings ID').optional(),
});

export const reprintReceiptSchema = z.object({
  receipt_id: z.string().uuid('Invalid receipt ID'),
});

export const emailReceiptSchema = z.object({
  receipt_id: z.string().uuid('Invalid receipt ID'),
  email_address: z.string().email('Invalid email address'),
});

export const updatePrintSettingsSchema = z.object({
  business_name: z.string().min(1).max(200).optional(),
  business_address: z.string().optional(),
  business_phone: z.string().max(50).optional(),
  business_email: z.string().email().optional(),
  tax_id: z.string().max(100).optional(),
  header_text: z.string().optional(),
  footer_text: z.string().optional(),
  return_policy: z.string().optional(),
  print_logo: z.boolean().optional(),
  logo_url: z.string().url().optional(),
  print_barcode: z.boolean().optional(),
  print_qr_code: z.boolean().optional(),
  paper_width: z.number().int().min(58).max(80).optional(),
  font_size: z.number().int().min(8).max(16).optional(),
  show_tax_breakdown: z.boolean().optional(),
  show_cashier_name: z.boolean().optional(),
  show_customer_info: z.boolean().optional(),
  is_default: z.boolean().optional(),
});

// ===== ANALYTICS VALIDATORS =====

export const dateRangeSchema = z.object({
  date_from: z.string().datetime({ message: 'Invalid date_from format' }),
  date_to: z.string().datetime({ message: 'Invalid date_to format' }),
});

export const salesTrendSchema = z.object({
  date_from: z.string().datetime(),
  date_to: z.string().datetime(),
  period: z.enum(['hour', 'day', 'week', 'month'], {
    errorMap: () => ({ message: 'Period must be: hour, day, week, or month' }),
  }),
});

export type GenerateReceiptInput = z.infer<typeof generateReceiptSchema>;
export type ReprintReceiptInput = z.infer<typeof reprintReceiptSchema>;
export type EmailReceiptInput = z.infer<typeof emailReceiptSchema>;
export type UpdatePrintSettingsInput = z.infer<typeof updatePrintSettingsSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type SalesTrendInput = z.infer<typeof salesTrendSchema>;





