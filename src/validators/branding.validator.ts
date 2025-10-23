import { z } from 'zod';

// Hex color regex
const hexColorRegex = /^#[0-9A-F]{6}$/i;

// Create branding schema
export const createBrandingSchema = z.object({
  company_name: z.string().min(1).max(255),
  company_name_ar: z.string().max(255).optional(),
  tagline: z.string().max(255).optional(),
  business_address: z.string().max(500).optional(),
  business_phone: z.string().max(50).optional(),
  business_email: z.string().email().optional(),
  business_website: z.string().url().optional(),
  tax_id: z.string().max(100).optional(),
  primary_color: z.string().regex(hexColorRegex).optional(),
  secondary_color: z.string().regex(hexColorRegex).optional(),
  accent_color: z.string().regex(hexColorRegex).optional(),
  success_color: z.string().regex(hexColorRegex).optional(),
  warning_color: z.string().regex(hexColorRegex).optional(),
  error_color: z.string().regex(hexColorRegex).optional(),
  font_family: z.enum(['INTER', 'ROBOTO', 'OPEN_SANS', 'LATO', 'POPPINS', 'CAIRO', 'AMIRI']).optional(),
  theme_mode: z.enum(['LIGHT', 'DARK', 'AUTO']).optional(),
  receipt_header_text: z.string().max(500).optional(),
  receipt_footer_text: z.string().max(500).optional(),
  receipt_logo_position: z.enum(['LEFT', 'CENTER', 'RIGHT']).optional(),
  invoice_template: z.string().max(50).optional(),
  invoice_watermark: z.string().max(100).optional(),
  show_watermark: z.boolean().optional(),
});

// Update branding schema (all fields optional)
export const updateBrandingSchema = createBrandingSchema.partial();

// Apply theme preset
export const applyPresetSchema = z.object({
  presetId: z.string().uuid(),
});

// Create custom preset
export const createPresetSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  primary_color: z.string().regex(hexColorRegex),
  secondary_color: z.string().regex(hexColorRegex),
  accent_color: z.string().regex(hexColorRegex),
});

// Generate CSS
export const generateCSSSchema = z.object({
  profileId: z.string().uuid(),
});





