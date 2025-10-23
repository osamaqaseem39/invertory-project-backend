import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z.string().email().max(255).transform(val => val.toLowerCase()),
  display_name: z.string().min(1).max(100),
  password: z.string().min(10),
  bootstrap_token: z.string().optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(1), // can be email or username
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(10),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().transform(val => val.toLowerCase()),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(10),
});

export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
export type RefreshTokenDTO = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordDTO = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;





