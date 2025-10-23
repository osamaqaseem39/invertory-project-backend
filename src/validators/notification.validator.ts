import { z } from 'zod';

// List notifications query
export const listNotificationsQuerySchema = z.object({
  isRead: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  type: z.enum([
    'STOCK_LOW',
    'STOCK_OUT',
    'STOCK_CRITICAL',
    'STOCK_REORDER',
    'PRODUCT_EXPIRING',
    'PRODUCT_EXPIRED',
    'PO_PENDING_APPROVAL',
    'ADJUSTMENT_PENDING',
    'PAYMENT_OVERDUE',
    'SYSTEM_ALERT',
    'USER_ACTION',
  ]).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
});

// Configure stock alert
export const configureAlertSchema = z.object({
  productId: z.string().uuid(),
  alertType: z.enum([
    'STOCK_LOW',
    'STOCK_OUT',
    'STOCK_CRITICAL',
    'STOCK_REORDER',
  ]),
  threshold: z.number().int().min(0),
  notifyRoles: z.array(z.enum([
    'owner_ultimate_super_admin',
    'admin',
    'cashier',
    'inventory_manager',
    'guest',
  ])).optional(),
  cooldownHours: z.number().int().min(1).max(168).optional(),
});

// Update preferences
export const updatePreferencesSchema = z.object({
  enable_in_app: z.boolean().optional(),
  enable_email: z.boolean().optional(),
  enable_sms: z.boolean().optional(),
  enable_push: z.boolean().optional(),
  stock_alerts: z.boolean().optional(),
  po_alerts: z.boolean().optional(),
  payment_alerts: z.boolean().optional(),
  system_alerts: z.boolean().optional(),
  quiet_hours_start: z.number().int().min(0).max(23).optional(),
  quiet_hours_end: z.number().int().min(0).max(23).optional(),
  daily_digest: z.boolean().optional(),
  digest_time: z.number().int().min(0).max(23).optional(),
});





