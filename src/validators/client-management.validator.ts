import { z } from 'zod';

// Client Status enum validation
const clientStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'REVOKED', 'TRIAL']);

// Message Type enum validation
const messageTypeSchema = z.enum(['CREDIT_REQUEST', 'SUPPORT_REQUEST', 'STATUS_UPDATE', 'BILLING_QUERY', 'TECHNICAL_ISSUE']);

// Message Status enum validation
const messageStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);

// Message Priority enum validation
const messagePrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

// Create client instance schema
export const createClientInstanceSchema = z.object({
  client_name: z.string().min(1).max(255),
  device_fingerprint: z.string().min(1).max(64),
  hardware_signature: z.string().min(1).max(128),
  contact_email: z.string().email().max(255),
  contact_phone: z.string().max(50).optional(),
  company_name: z.string().max(255).optional(),
  country: z.string().max(2).optional(),
  timezone: z.string().max(50).optional(),
  trial_guest_id: z.string().max(64).optional(),
  license_key_id: z.string().uuid().optional(),
});

// Update client instance schema
export const updateClientInstanceSchema = z.object({
  client_name: z.string().min(1).max(255).optional(),
  contact_email: z.string().email().max(255).optional(),
  contact_phone: z.string().max(50).optional(),
  company_name: z.string().max(255).optional(),
  country: z.string().max(2).optional(),
  timezone: z.string().max(50).optional(),
  license_key_id: z.string().uuid().optional(),
});

// Update client status schema
export const updateClientStatusSchema = z.object({
  status: clientStatusSchema,
});

// Record usage stats schema
export const recordUsageStatsSchema = z.object({
  client_id: z.string().uuid(),
  credits_consumed: z.number().min(0).optional(),
  invoices_created: z.number().min(0).optional(),
  sales_amount: z.number().min(0).optional(),
  active_users: z.number().min(0).optional(),
  login_count: z.number().min(0).optional(),
  sync_count: z.number().min(0).optional(),
});

// Query filters schema
export const clientQueryFiltersSchema = z.object({
  status: clientStatusSchema.optional(),
  country: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
});

// Create message schema
export const createMessageSchema = z.object({
  client_instance_id: z.string().uuid(),
  message_type: messageTypeSchema,
  subject: z.string().min(1).max(255),
  message_content: z.string().min(1),
  priority: messagePrioritySchema.optional(),
});

// Respond to message schema
export const respondToMessageSchema = z.object({
  response_content: z.string().min(1),
});

// Update message status schema
export const updateMessageStatusSchema = z.object({
  status: messageStatusSchema,
});

// Message query filters schema
export const messageQueryFiltersSchema = z.object({
  client_instance_id: z.string().uuid().optional(),
  message_type: messageTypeSchema.optional(),
  status: messageStatusSchema.optional(),
  priority: messagePrioritySchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
});

// Notification query filters schema
export const notificationQueryFiltersSchema = z.object({
  client_instance_id: z.string().uuid().optional(),
  notification_type: z.string().optional(),
  is_read: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
});

export type CreateClientInstanceInput = z.infer<typeof createClientInstanceSchema>;
export type UpdateClientInstanceInput = z.infer<typeof updateClientInstanceSchema>;
export type UpdateClientStatusInput = z.infer<typeof updateClientStatusSchema>;
export type RecordUsageStatsInput = z.infer<typeof recordUsageStatsSchema>;
export type ClientQueryFiltersInput = z.infer<typeof clientQueryFiltersSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type RespondToMessageInput = z.infer<typeof respondToMessageSchema>;
export type UpdateMessageStatusInput = z.infer<typeof updateMessageStatusSchema>;
export type MessageQueryFiltersInput = z.infer<typeof messageQueryFiltersSchema>;
export type NotificationQueryFiltersInput = z.infer<typeof notificationQueryFiltersSchema>;
