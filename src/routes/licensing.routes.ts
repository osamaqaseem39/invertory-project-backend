import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { TrialValidationService } from '../services/trial-validation.service';
import { LicenseGenerationService } from '../services/license-generation.service';
import { HardwareFingerprintService } from '../services/hardware-fingerprint.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import {
  trialCheckSchema,
  consumeCreditSchema,
  generateLicenseSchema,
  activateLicenseSchema,
  verifyLicenseSchema,
} from '../validators/licensing.validator';
import { UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const router = Router();

// RBAC helper
const requireRole = (allowedRoles: UserRole[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action',
        },
      });
    }
    next();
  };
};

const ADMIN_ROLES = [UserRole.owner_ultimate_super_admin, UserRole.admin];

// ===== TRIAL ENDPOINTS (PUBLIC) =====

/**
 * POST /api/v1/licensing/trial/check
 * Check if device is eligible for trial (PUBLIC - no auth)
 */
router.post('/trial/check', validateBody(trialCheckSchema), async (req: any, res) => {
  try {
    const result = await TrialValidationService.checkTrialEligibility({
      deviceFingerprint: req.body.device_fingerprint,
      hardwareSignature: req.body.hardware_signature,
      ipAddress: req.body.ip_address || req.ip,
      userAgent: req.body.user_agent || req.get('user-agent'),
      countryCode: req.body.country_code,
      timezone: req.body.timezone,
    });

    // Save hardware fingerprint
    const fingerprintData = await HardwareFingerprintService.generateFingerprint({
      macAddress: req.body.mac_address,
      cpuId: req.body.cpu_id,
      motherboardSerial: req.body.motherboard_serial,
      diskSerial: req.body.disk_serial,
      systemUuid: req.body.system_uuid,
      platform: req.body.platform,
      osVersion: req.body.os_version,
      hostname: req.body.hostname,
    });

    await HardwareFingerprintService.saveFingerprint(fingerprintData);

    // Check for trial reset attempts
    if (result.eligible) {
      const resetAttempt = await TrialValidationService.detectTrialResetAttempt(
        req.body.device_fingerprint,
        req.body.hardware_signature
      );

      if (resetAttempt.isAttempt) {
        return res.status(403).json({
          error: {
            code: 'TRIAL_RESET_DETECTED',
            message: resetAttempt.reason,
          },
        });
      }
    }

    return res.status(200).json({ data: result });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'TRIAL_CHECK_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/v1/licensing/trial/consume
 * Consume a trial credit (PUBLIC - no auth for trial users)
 */
router.post('/trial/consume', validateBody(consumeCreditSchema), async (req: any, res) => {
  try {
    const result = await TrialValidationService.consumeCredit(
      req.body.device_fingerprint,
      req.body.action,
      req.body.reference_id,
      req.body.metadata
    );

    if (!result.success) {
      return res.status(402).json({
        error: {
          code: 'INSUFFICIENT_CREDITS',
          message: result.message,
        },
        credits_remaining: result.creditsRemaining,
      });
    }

    return res.status(200).json({
      message: result.message,
      credits_remaining: result.creditsRemaining,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'CREDIT_CONSUMPTION_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * GET /api/v1/licensing/trial/stats
 * Get trial statistics (PUBLIC - for user's own trial)
 */
router.get('/trial/stats/:fingerprint', async (req: any, res) => {
  try {
    const stats = await TrialValidationService.getTrialStats(req.params.fingerprint);

    if (!stats) {
      return res.status(404).json({
        error: {
          code: 'TRIAL_NOT_FOUND',
          message: 'Trial session not found',
        },
      });
    }

    return res.status(200).json({ data: stats });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'GET_STATS_FAILED',
        message: error.message,
      },
    });
  }
});

// ===== LICENSE ENDPOINTS (ADMIN) =====

/**
 * POST /api/v1/licensing/license/generate
 * Generate a new license key (ADMIN ONLY)
 */
router.post('/license/generate', authenticateToken, requireRole(ADMIN_ROLES), validateBody(generateLicenseSchema), async (req: any, res) => {
  try {
    const license = await LicenseGenerationService.generateLicense({
      ...req.body,
      createdById: req.user.id,
    });

    return res.status(201).json({
      message: 'License generated successfully',
      data: {
        license_key: license.license_key,
        jwt_token: license.jwt_token,
        public_key: license.public_key,
        expires_at: license.expires_at,
        license_type: license.license_type,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'LICENSE_GENERATION_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/v1/licensing/license/activate
 * Activate a license key (PUBLIC)
 */
router.post('/license/activate', validateBody(activateLicenseSchema), async (req: any, res) => {
  try {
    const result = await LicenseGenerationService.activateLicense(
      req.body.license_key,
      req.body.device_fingerprint,
      req.body.hardware_signature,
      req.body.activation_method || 'ONLINE',
      req.body.ip_address || req.ip,
      req.body.user_agent || req.get('user-agent'),
      req.body.country_code
    );

    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'ACTIVATION_FAILED',
          message: result.message,
        },
      });
    }

    return res.status(200).json({
      message: result.message,
      data: {
        license: result.license,
        jwt_token: result.license?.jwt_token,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'ACTIVATION_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/v1/licensing/license/verify
 * Verify JWT license token (PUBLIC)
 */
router.post('/license/verify', validateBody(verifyLicenseSchema), async (req: any, res) => {
  try {
    const result = await LicenseGenerationService.verifyLicenseToken(
      req.body.jwt_token,
      req.body.device_fingerprint
    );

    if (!result.valid) {
      return res.status(401).json({
        error: {
          code: 'INVALID_LICENSE',
          message: result.reason,
        },
      });
    }

    return res.status(200).json({
      valid: true,
      payload: result.payload,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'VERIFICATION_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * GET /api/v1/licensing/license/:key
 * Get license details (ADMIN ONLY)
 */
router.get('/license/:key', authenticateToken, requireRole(ADMIN_ROLES), async (req: any, res) => {
  try {
    const license = await LicenseGenerationService.getLicenseDetails(req.params.key);

    if (!license) {
      return res.status(404).json({
        error: {
          code: 'LICENSE_NOT_FOUND',
          message: 'License key not found',
        },
      });
    }

    return res.status(200).json({ data: license });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'GET_LICENSE_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/v1/licensing/license/:key/revoke
 * Revoke a license (ADMIN ONLY)
 */
router.post('/license/:key/revoke', authenticateToken, requireRole(ADMIN_ROLES), async (req: any, res) => {
  try {
    await LicenseGenerationService.revokeLicense(req.params.key, req.body.reason || 'Manual revocation');

    return res.status(200).json({
      message: 'License revoked successfully',
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'REVOKE_FAILED',
        message: error.message,
      },
    });
  }
});

// ===== ADMIN ENDPOINTS =====

/**
 * GET /api/v1/licensing/admin/trials
 * Get all trials (ADMIN ONLY)
 */
router.get('/admin/trials', authenticateToken, requireRole(ADMIN_ROLES), async (_req: any, res) => {
  try {
    const trials = await prisma.trialRegistry.findMany({
      orderBy: { first_seen_at: 'desc' },
      take: 100,
    });

    return res.status(200).json({ data: trials });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'GET_TRIALS_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * GET /api/v1/licensing/admin/licenses
 * Get all licenses (ADMIN ONLY)
 */
router.get('/admin/licenses', authenticateToken, requireRole(ADMIN_ROLES), async (_req: any, res) => {
  try {
    const licenses = await prisma.enhancedLicenseKey.findMany({
      orderBy: { created_at: 'desc' },
      take: 100,
      include: {
        created_by: {
          select: { id: true, username: true, display_name: true },
        },
      },
    });

    return res.status(200).json({ data: licenses });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'GET_LICENSES_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * GET /api/v1/licensing/admin/suspicious
 * Get suspicious activities (ADMIN ONLY)
 */
router.get('/admin/suspicious', authenticateToken, requireRole(ADMIN_ROLES), async (_req: any, res) => {
  try {
    const activities = await TrialValidationService.getSuspiciousActivities(100);

    return res.status(200).json({ data: activities });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'GET_SUSPICIOUS_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/v1/licensing/setup/generate-keys
 * Generate RSA key pair (ONE-TIME SETUP - ADMIN ONLY)
 */
router.post('/setup/generate-keys', authenticateToken, requireRole(ADMIN_ROLES), async (_req: any, res) => {
  try {
    await LicenseGenerationService.generateKeyPair();

    return res.status(201).json({
      message: 'RSA key pair generated successfully',
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'KEY_GENERATION_FAILED',
        message: error.message,
      },
    });
  }
});

export default router;

