import { z } from 'zod';
import { AuditAction } from '@prisma/client';

export const listAuditLogsQuerySchema = z.object({
  actor_user_id: z.string().uuid().optional(),
  target_user_id: z.string().uuid().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  limit: z.string().optional().transform(val => parseInt(val || '20', 10)),
});

export type ListAuditLogsQueryDTO = z.infer<typeof listAuditLogsQuerySchema>;





