import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const createUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z.string().email().max(255).transform(val => val.toLowerCase()),
  display_name: z.string().min(1).max(100),
  password: z.string().min(10),
  role: z.nativeEnum(UserRole),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  email: z.string().email().max(255).transform(val => val.toLowerCase()).optional(),
  display_name: z.string().min(1).max(100).optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export const updateStatusSchema = z.object({
  is_active: z.boolean(),
});

export const listUsersQuerySchema = z.object({
  q: z.string().optional(), // Search query
  role: z.nativeEnum(UserRole).optional(),
  is_active: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  limit: z.string().optional().transform(val => parseInt(val || '10', 10)),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;
export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
export type UpdateStatusDTO = z.infer<typeof updateStatusSchema>;
export type ListUsersQueryDTO = z.infer<typeof listUsersQuerySchema>;

