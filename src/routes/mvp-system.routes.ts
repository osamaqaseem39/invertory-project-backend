import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireMasterAdmin } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { z } from 'zod';
import { DatabaseIsolationService } from '../services/database-isolation.service';
import { TrialSystemService } from '../services/trial-system.service';
import { LicenseManagementService } from '../services/license-management.service';
import { ClientOnboardingService } from '../services/client-onboarding.service';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const clientOnboardingSchema = z.object({
  client_name: z.string().min(1).max(255),
  contact_email: z.string().email(),
  contact_phone: z.string().optional(),
  company_name: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  device_fingerprint: z.string().min(1).max(64),
  hardware_signature: z.string().min(1).max(128),
});

const licenseActivationSchema = z.object({
  license_key: z.string().length(32).regex(/^[A-Z0-9]+$/),
  device_fingerprint: z.string().min(1).max(64),
});

const creditConsumptionSchema = z.object({
  operation_type: z.string().min(1).max(100),
  device_fingerprint: z.string().min(1).max(64),
});

const licenseUpgradeSchema = z.object({
  license_type: z.enum(['STARTER', 'BUSINESS', 'PROFESSIONAL', 'ENTERPRISE']),
  contact_email: z.string().email(),
  contact_phone: z.string().optional(),
  message: z.string().optional(),
});

// ===== CLIENT ONBOARDING =====

/**
 * @route POST /api/v1/mvp/onboard-client
 * @desc Onboard a new client with separate database and trial session
 * @access Private (Master Admin only)
 */
router.post(
  '/onboard-client',
  authenticateToken,
  requireMasterAdmin,
  validateBody(clientOnboardingSchema),
  async (req, res, next) => {
    try {
      const result = await ClientOnboardingService.onboardClient(
        req.body,
        req.user!.id
      );

      res.status(201).json({
        message: 'Client onboarded successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/mvp/onboarding-status/:clientId
 * @desc Get client onboarding status
 * @access Private (Master Admin only)
 */
router.get(
  '/onboarding-status/:clientId',
  authenticateToken,
  requireMasterAdmin,
  async (req, res, next) => {
    try {
      const { clientId } = req.params;
      const status = await ClientOnboardingService.getOnboardingStatus(clientId);

      res.status(200).json({
        message: 'Onboarding status retrieved successfully',
        data: status
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===== TRIAL SYSTEM =====

/**
 * @route POST /api/v1/mvp/initialize-trial
 * @desc Initialize trial session for a client
 * @access Private (Master Admin only)
 */
router.post(
  '/initialize-trial',
  authenticateToken,
  requireMasterAdmin,
  validateBody(z.object({
    client_id: z.string().uuid(),
    device_fingerprint: z.string().min(1).max(64),
  })),
  async (req, res, next) => {
    try {
      const { client_id, device_fingerprint } = req.body;
      const trialSession = await TrialSystemService.initializeTrialSession(
        client_id,
        device_fingerprint
      );

      res.status(201).json({
        message: 'Trial session initialized successfully',
        data: trialSession
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/mvp/check-credits
 * @desc Check if client has enough credits for an operation
 * @access Private (Master Admin only)
 */
router.post(
  '/check-credits',
  authenticateToken,
  requireMasterAdmin,
  validateBody(creditConsumptionSchema),
  async (req, res, next) => {
    try {
      const { operation_type, device_fingerprint } = req.body;
      const client_id = req.query.client_id as string;

      if (!client_id) {
        return res.status(400).json({
          error: {
            code: 'MISSING_CLIENT_ID',
            message: 'Client ID is required'
          }
        });
      }

      const result = await TrialSystemService.checkCredits(
        client_id,
        device_fingerprint,
        operation_type
      );

      res.status(200).json({
        message: 'Credit check completed',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/mvp/consume-credits
 * @desc Consume credits for an operation
 * @access Private (Master Admin only)
 */
router.post(
  '/consume-credits',
  authenticateToken,
  requireMasterAdmin,
  validateBody(creditConsumptionSchema),
  async (req, res, next) => {
    try {
      const { operation_type, device_fingerprint } = req.body;
      const client_id = req.query.client_id as string;

      if (!client_id) {
        return res.status(400).json({
          error: {
            code: 'MISSING_CLIENT_ID',
            message: 'Client ID is required'
          }
        });
      }

      const result = await TrialSystemService.consumeCredits(
        client_id,
        device_fingerprint,
        operation_type
      );

      res.status(200).json({
        message: 'Credits consumed successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/mvp/trial-status/:clientId
 * @desc Get trial status for a client
 * @access Private (Master Admin only)
 */
router.get(
  '/trial-status/:clientId',
  authenticateToken,
  requireMasterAdmin,
  async (req, res, next) => {
    try {
      const { clientId } = req.params;
      const { device_fingerprint } = req.query;

      if (!device_fingerprint) {
        return res.status(400).json({
          error: {
            code: 'MISSING_DEVICE_FINGERPRINT',
            message: 'Device fingerprint is required'
          }
        });
      }

      const trialStatus = await TrialSystemService.getTrialStatus(
        clientId,
        device_fingerprint as string
      );

      res.status(200).json({
        message: 'Trial status retrieved successfully',
        data: trialStatus
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/mvp/credit-history/:clientId
 * @desc Get credit transaction history for a client
 * @access Private (Master Admin only)
 */
router.get(
  '/credit-history/:clientId',
  authenticateToken,
  requireMasterAdmin,
  async (req, res, next) => {
    try {
      const { clientId } = req.params;
      const { device_fingerprint, limit } = req.query;

      if (!device_fingerprint) {
        return res.status(400).json({
          error: {
            code: 'MISSING_DEVICE_FINGERPRINT',
            message: 'Device fingerprint is required'
          }
        });
      }

      const creditHistory = await TrialSystemService.getCreditHistory(
        clientId,
        device_fingerprint as string,
        limit ? parseInt(limit as string) : 50
      );

      res.status(200).json({
        message: 'Credit history retrieved successfully',
        data: creditHistory
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===== LICENSE MANAGEMENT =====

/**
 * @route POST /api/v1/mvp/create-license
 * @desc Create a new license key for a client
 * @access Private (Master Admin only)
 */
router.post(
  '/create-license',
  authenticateToken,
  requireMasterAdmin,
  validateBody(z.object({
    client_id: z.string().uuid(),
    license_type: z.enum(['STARTER', 'BUSINESS', 'PROFESSIONAL', 'ENTERPRISE']),
    device_fingerprint: z.string().min(1).max(64),
    contact_email: z.string().email(),
    custom_credits: z.number().optional(),
    custom_duration: z.number().optional(),
  })),
  async (req, res, next) => {
    try {
      const {
        client_id,
        license_type,
        device_fingerprint,
        contact_email,
        custom_credits,
        custom_duration
      } = req.body;

      const licenseKey = await LicenseManagementService.createLicenseKey(
        client_id,
        license_type,
        device_fingerprint,
        contact_email,
        req.user!.id,
        custom_credits,
        custom_duration
      );

      res.status(201).json({
        message: 'License key created successfully',
        data: licenseKey
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/mvp/activate-license
 * @desc Activate a license key
 * @access Private (Master Admin only)
 */
router.post(
  '/activate-license',
  authenticateToken,
  requireMasterAdmin,
  validateBody(licenseActivationSchema),
  async (req, res, next) => {
    try {
      const { license_key, device_fingerprint } = req.body;
      const client_id = req.query.client_id as string;

      if (!client_id) {
        return res.status(400).json({
          error: {
            code: 'MISSING_CLIENT_ID',
            message: 'Client ID is required'
          }
        });
      }

      const result = await LicenseManagementService.activateLicenseKey(
        license_key,
        device_fingerprint,
        client_id
      );

      res.status(200).json({
        message: 'License activation completed',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/mvp/license-details/:licenseKey
 * @desc Get license key details
 * @access Private (Master Admin only)
 */
router.get(
  '/license-details/:licenseKey',
  authenticateToken,
  requireMasterAdmin,
  async (req, res, next) => {
    try {
      const { licenseKey } = req.params;
      const licenseDetails = await LicenseManagementService.getLicenseKeyDetails(licenseKey);

      if (!licenseDetails) {
        return res.status(404).json({
          error: {
            code: 'LICENSE_NOT_FOUND',
            message: 'License key not found'
          }
        });
      }

      res.status(200).json({
        message: 'License details retrieved successfully',
        data: licenseDetails
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/mvp/license-pricing
 * @desc Get license pricing information
 * @access Public
 */
router.get('/license-pricing', async (req, res, next) => {
  try {
    const pricing = LicenseManagementService.getLicensePricing();

    res.status(200).json({
      message: 'License pricing retrieved successfully',
      data: pricing
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/mvp/process-upgrade-request
 * @desc Process license upgrade request
 * @access Private (Master Admin only)
 */
router.post(
  '/process-upgrade-request',
  authenticateToken,
  requireMasterAdmin,
  validateBody(z.object({
    client_id: z.string().uuid(),
    ...licenseUpgradeSchema.shape
  })),
  async (req, res, next) => {
    try {
      const { client_id, license_type, contact_email, contact_phone, message } = req.body;

      const result = await ClientOnboardingService.processLicenseUpgradeRequest(
        client_id,
        license_type,
        { email: contact_email, phone: contact_phone, message },
        req.user!.id
      );

      res.status(200).json({
        message: 'License upgrade request processed successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===== DATABASE MANAGEMENT =====

/**
 * @route GET /api/v1/mvp/client-databases
 * @desc List all client databases
 * @access Private (Master Admin only)
 */
router.get(
  '/client-databases',
  authenticateToken,
  requireMasterAdmin,
  async (req, res, next) => {
    try {
      const databases = await DatabaseIsolationService.listClientDatabases();

      res.status(200).json({
        message: 'Client databases retrieved successfully',
        data: databases
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/mvp/database-info/:clientId
 * @desc Get client database information
 * @access Private (Master Admin only)
 */
router.get(
  '/database-info/:clientId',
  authenticateToken,
  requireMasterAdmin,
  async (req, res, next) => {
    try {
      const { clientId } = req.params;
      const dbInfo = await DatabaseIsolationService.getClientDatabaseInfo(clientId);

      res.status(200).json({
        message: 'Database information retrieved successfully',
        data: dbInfo
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/v1/mvp/client-database/:clientId
 * @desc Drop client database
 * @access Private (Master Admin only)
 */
router.delete(
  '/client-database/:clientId',
  authenticateToken,
  requireMasterAdmin,
  async (req, res, next) => {
    try {
      const { clientId } = req.params;
      await DatabaseIsolationService.dropClientDatabase(clientId);

      res.status(200).json({
        message: 'Client database dropped successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===== CLIENT DASHBOARD =====

/**
 * @route GET /api/v1/mvp/client-dashboard/:clientId
 * @desc Get client dashboard data
 * @access Private (Master Admin only)
 */
router.get(
  '/client-dashboard/:clientId',
  authenticateToken,
  requireMasterAdmin,
  async (req, res, next) => {
    try {
      const { clientId } = req.params;
      const dashboardData = await ClientOnboardingService.getClientDashboardData(clientId);

      res.status(200).json({
        message: 'Client dashboard data retrieved successfully',
        data: dashboardData
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/mvp/onboarding-statistics
 * @desc Get onboarding statistics
 * @access Private (Master Admin only)
 */
router.get(
  '/onboarding-statistics',
  authenticateToken,
  requireMasterAdmin,
  async (req, res, next) => {
    try {
      const statistics = await ClientOnboardingService.getOnboardingStatistics();

      res.status(200).json({
        message: 'Onboarding statistics retrieved successfully',
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===== CLIENT MANAGEMENT =====

/**
 * @route POST /api/v1/mvp/deactivate-client/:clientId
 * @desc Deactivate a client
 * @access Private (Master Admin only)
 */
router.post(
  '/deactivate-client/:clientId',
  authenticateToken,
  requireMasterAdmin,
  validateBody(z.object({
    reason: z.string().min(1).max(500),
  })),
  async (req, res, next) => {
    try {
      const { clientId } = req.params;
      const { reason } = req.body;

      const result = await ClientOnboardingService.deactivateClient(
        clientId,
        reason,
        req.user!.id
      );

      res.status(200).json({
        message: 'Client deactivated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/mvp/reactivate-client/:clientId
 * @desc Reactivate a client
 * @access Private (Master Admin only)
 */
router.post(
  '/reactivate-client/:clientId',
  authenticateToken,
  requireMasterAdmin,
  async (req, res, next) => {
    try {
      const { clientId } = req.params;

      const result = await ClientOnboardingService.reactivateClient(
        clientId,
        req.user!.id
      );

      res.status(200).json({
        message: 'Client reactivated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
