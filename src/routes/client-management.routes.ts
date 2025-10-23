import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { ClientManagementService } from '../services/client-management.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { AuthorizationError } from '../utils/errors';
import {
  createClientInstanceSchema,
  updateClientInstanceSchema,
  updateClientStatusSchema,
  recordUsageStatsSchema,
  clientQueryFiltersSchema,
} from '../validators/client-management.validator';

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

/**
 * GET /api/v1/client-management/clients
 * Get all client instances with filters
 */
router.get(
  '/clients',
  authenticateToken,
  requireMasterAdmin,
  validateQuery(clientQueryFiltersSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const filters = {
        status: req.query.status as any,
        country: req.query.country as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        dateRange: req.query.start_date && req.query.end_date ? {
          start: new Date(req.query.start_date as string),
          end: new Date(req.query.end_date as string),
        } : undefined,
      };

      const result = await ClientManagementService.getClientInstances(
        filters,
        req.user!.role as UserRole
      );

      res.json({
        message: 'Client instances retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/client-management/clients/:id
 * Get client instance by ID
 */
router.get(
  '/clients/:id',
  authenticateToken,
  requireMasterAdmin,
  async (req: AuthRequest, res, next) => {
    try {
      const client = await ClientManagementService.getClientInstanceById(
        req.params.id,
        req.user!.role as UserRole
      );

      res.json({
        message: 'Client instance retrieved successfully',
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/client-management/clients
 * Register a new client instance
 */
router.post(
  '/clients',
  authenticateToken,
  requireMasterAdmin,
  validateBody(createClientInstanceSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const client = await ClientManagementService.registerClientInstance(
        {
          clientName: req.body.client_name,
          deviceFingerprint: req.body.device_fingerprint,
          hardwareSignature: req.body.hardware_signature,
          contactEmail: req.body.contact_email,
          contactPhone: req.body.contact_phone,
          companyName: req.body.company_name,
          country: req.body.country,
          timezone: req.body.timezone,
          trialGuestId: req.body.trial_guest_id,
          licenseKeyId: req.body.license_key_id,
          createdById: req.user!.id,
        },
        req.user!.role as UserRole
      );

      res.status(201).json({
        message: 'Client instance registered successfully',
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/client-management/clients/:id
 * Update client instance
 */
router.put(
  '/clients/:id',
  authenticateToken,
  requireMasterAdmin,
  validateBody(updateClientInstanceSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const client = await ClientManagementService.updateClientInstance(
        req.params.id,
        {
          clientName: req.body.client_name,
          contactEmail: req.body.contact_email,
          contactPhone: req.body.contact_phone,
          companyName: req.body.company_name,
          country: req.body.country,
          timezone: req.body.timezone,
          licenseKeyId: req.body.license_key_id,
        },
        req.user!.role as UserRole,
        req.user!.id
      );

      res.json({
        message: 'Client instance updated successfully',
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/client-management/clients/:id/status
 * Update client status
 */
router.patch(
  '/clients/:id/status',
  authenticateToken,
  requireMasterAdmin,
  validateBody(updateClientStatusSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const client = await ClientManagementService.updateClientStatus(
        req.params.id,
        req.body.status,
        req.user!.role as UserRole,
        req.user!.id
      );

      res.json({
        message: `Client status updated to ${req.body.status} successfully`,
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/client-management/clients/:id/usage
 * Get client usage statistics
 */
router.get(
  '/clients/:id/usage',
  authenticateToken,
  requireMasterAdmin,
  async (req: AuthRequest, res, next) => {
    try {
      const stats = await ClientManagementService.getClientUsageStats(
        req.params.id,
        req.user!.role as UserRole
      );

      res.json({
        message: 'Client usage statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/client-management/dashboard/stats
 * Get master dashboard statistics
 */
router.get(
  '/dashboard/stats',
  authenticateToken,
  requireMasterAdmin,
  async (req: AuthRequest, res, next) => {
    try {
      const stats = await ClientManagementService.getMasterDashboardStats(
        req.user!.role as UserRole
      );

      res.json({
        message: 'Master dashboard statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/client-management/usage/record
 * Record client usage statistics (called by client instances)
 */
router.post(
  '/usage/record',
  authenticateToken,
  validateBody(recordUsageStatsSchema),
  async (req: AuthRequest, res, next) => {
    try {
      await ClientManagementService.recordUsageStats(
        req.body.client_id,
        {
          creditsConsumed: req.body.credits_consumed,
          invoicesCreated: req.body.invoices_created,
          salesAmount: req.body.sales_amount,
          activeUsers: req.body.active_users,
          loginCount: req.body.login_count,
          syncCount: req.body.sync_count,
        }
      );

      res.json({
        message: 'Usage statistics recorded successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
