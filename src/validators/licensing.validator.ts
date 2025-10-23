import { z } from 'zod';

// Trial check schema
export const trialCheckSchema = z.object({
  device_fingerprint: z.string().min(32).max(128),
  hardware_signature: z.string().min(32).max(256),
  
  // Hardware components (optional for enhanced tracking)
  mac_address: z.string().optional(),
  cpu_id: z.string().optional(),
  motherboard_serial: z.string().optional(),
  disk_serial: z.string().optional(),
  system_uuid: z.string().optional(),
  
  // System info
  platform: z.string(),
  os_version: z.string().optional(),
  hostname: z.string().optional(),
  
  // Network info
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  country_code: z.string().length(2).optional(),
  timezone: z.string().optional(),
});

// Consume credit schema
export const consumeCreditSchema = z.object({
  device_fingerprint: z.string().min(32).max(128),
  action: z.string().min(1).max(50),
  reference_id: z.string().max(64).optional(),
  metadata: z.any().optional(),
});

// Generate license schema
export const generateLicenseSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().max(255).optional(),
  companyName: z.string().max(255).optional(),
  licenseType: z.enum(['TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'MONTHLY', 'YEARLY', 'PERPETUAL']),
  deviceFingerprint: z.string().min(32).max(128).optional(),
  hardwareSignature: z.string().min(32).max(256).optional(),
  maxActivations: z.number().int().min(1).max(100).default(1),
  expiresInDays: z.number().int().min(1).max(36500).optional(), // null = perpetual
  purchaseAmount: z.number().min(0).optional(),
  currency: z.string().length(3).default('USD'),
  paymentId: z.string().max(255).optional(),
  features: z.any().optional(),
  creditLimit: z.number().int().min(0).optional(),
});

// Activate license schema
export const activateLicenseSchema = z.object({
  license_key: z.string().min(10).max(64),
  device_fingerprint: z.string().min(32).max(128),
  hardware_signature: z.string().min(32).max(256),
  activation_method: z.enum(['ONLINE', 'OFFLINE', 'MANUAL']).default('ONLINE'),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  country_code: z.string().length(2).optional(),
});

// Verify license schema
export const verifyLicenseSchema = z.object({
  jwt_token: z.string().min(10),
  device_fingerprint: z.string().min(32).max(128),
});





