import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { AdvancedLicenseService } from '../services/advanced-license.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { z } from 'zod';

const router = Router();

// RBAC helper for master admin only
const requireMasterAdmin = (req: AuthRequest, res: any, next: any) => {
  if (!req.user || req.user.role !== UserRole.master_admin) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Only master admin can access this endpoint',
      },
    });
  }
  next();
};

// Validation schemas
const createLicenseSchema = z.object({
  client_instance_id: z.string().uuid(),
  license_type: z.string().min(1),
  duration_months: z.number().min(1).max(120),
  max_credits: z.number().min(1),
  features: z.array(z.string()).min(1),
});

const purchaseCreditsSchema = z.object({
  client_instance_id: z.string().uuid(),
  credit_pack: z.enum(['STARTER', 'BUSINESS', 'ENTERPRISE', 'CUSTOM']),
  amount: z.number().min(1),
  payment_method: z.string().min(1),
});

const activateLicenseSchema = z.object({
  license_key: z.string().min(1),
  device_fingerprint: z.string().optional(),
  hardware_signature: z.string().optional(),
  client_info: z.object({
    platform: z.string().optional(),
    version: z.string().optional(),
    architecture: z.string().optional(),
  }).optional(),
});

const revokeLicenseSchema = z.object({
  reason: z.string().min(1),
});

/**
 * POST /api/v1/advanced-license/create
 * Create a new license for a client
 */
router.post(
  '/create',
  authenticateToken,
  requireMasterAdmin,
  validateBody(createLicenseSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const license = await AdvancedLicenseService.createLicense({
        clientInstanceId: req.body.client_instance_id,
        licenseType: req.body.license_type,
        durationMonths: req.body.duration_months,
        maxCredits: req.body.max_credits,
        features: req.body.features,
        actorId: req.user!.id,
      });

      res.status(201).json({
        message: 'License created successfully',
        data: license,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/advanced-license/purchase-credits
 * Purchase credits for a client
 */
router.post(
  '/purchase-credits',
  authenticateToken,
  validateBody(purchaseCreditsSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await AdvancedLicenseService.purchaseCredits({
        clientInstanceId: req.body.client_instance_id,
        creditPack: req.body.credit_pack,
        amount: req.body.amount,
        paymentMethod: req.body.payment_method,
        actorId: req.user!.id,
      });

      res.status(200).json({
        message: 'Credits purchased successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/advanced-license/activate
 * Activate a license
 */
router.post(
  '/activate',
  authenticateToken,
  validateBody(activateLicenseSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await AdvancedLicenseService.activateLicense({
        licenseKey: req.body.license_key,
        deviceFingerprint: req.body.device_fingerprint,
        hardwareSignature: req.body.hardware_signature,
        clientInfo: req.body.client_info,
      });

      res.status(200).json({
        message: 'License activated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/advanced-license/status/:clientId
 * Get license status for a client
 */
router.get(
  '/status/:clientId',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const result = await AdvancedLicenseService.getLicenseStatus(
        req.params.clientId,
        req.user!.role as UserRole
      );

      res.json({
        message: 'License status retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/advanced-license/billing/:clientId
 * Get billing summary for a client
 */
router.get(
  '/billing/:clientId',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const result = await AdvancedLicenseService.getBillingSummary(
        req.params.clientId,
        req.user!.role as UserRole
      );

      res.json({
        message: 'Billing summary retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/advanced-license/all
 * Get all licenses (master admin only)
 */
router.get(
  '/all',
  authenticateToken,
  requireMasterAdmin,
  async (req: AuthRequest, res, next) => {
    try {
      const result = await AdvancedLicenseService.getAllLicenses(
        req.user!.role as UserRole
      );

      res.json({
        message: 'All licenses retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/advanced-license/revoke/:licenseId
 * Revoke a license (master admin only)
 */
router.post(
  '/revoke/:licenseId',
  authenticateToken,
  requireMasterAdmin,
  validateBody(revokeLicenseSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await AdvancedLicenseService.revokeLicense(
        req.params.licenseId,
        req.body.reason,
        req.user!.role as UserRole,
        req.user!.id
      );

      res.json({
        message: 'License revoked successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/advanced-license/pricing
 * Get credit pricing information
 */
router.get(
  '/pricing',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const pricing = {
        STARTER: { pricePerCredit: 0.10, packName: 'Starter Pack', minCredits: 100 },
        BUSINESS: { pricePerCredit: 0.08, packName: 'Business Pack', minCredits: 500 },
        ENTERPRISE: { pricePerCredit: 0.05, packName: 'Enterprise Pack', minCredits: 1000 },
        CUSTOM: { pricePerCredit: 0.12, packName: 'Custom Pack', minCredits: 50 },
      };

      res.json({
        message: 'Credit pricing retrieved successfully',
        data: pricing,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
