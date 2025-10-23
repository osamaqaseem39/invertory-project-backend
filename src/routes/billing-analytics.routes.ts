import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { BillingAnalyticsService } from '../services/billing-analytics.service';
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
const createBillingRecordSchema = z.object({
  client_instance_id: z.string().uuid(),
  billing_type: z.string().min(1),
  amount: z.number().min(0.01),
  description: z.string().min(1),
  payment_method: z.string().min(1),
});

const processPaymentSchema = z.object({
  payment_amount: z.number().min(0.01),
  payment_method: z.string().min(1),
  transaction_id: z.string().min(1),
});

const analyticsFiltersSchema = z.object({
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  client_id: z.string().uuid().optional(),
  billing_type: z.string().optional(),
  status: z.string().optional(),
});

/**
 * POST /api/v1/billing-analytics/billing
 * Create a billing record
 */
router.post(
  '/billing',
  authenticateToken,
  validateBody(createBillingRecordSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const billingRecord = await BillingAnalyticsService.createBillingRecord({
        clientInstanceId: req.body.client_instance_id,
        billingType: req.body.billing_type,
        amount: req.body.amount,
        description: req.body.description,
        paymentMethod: req.body.payment_method,
        actorId: req.user!.id,
      });

      res.status(201).json({
        message: 'Billing record created successfully',
        data: billingRecord,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/billing-analytics/payment/:billingId
 * Process payment for a billing record
 */
router.post(
  '/payment/:billingId',
  authenticateToken,
  requireMasterAdmin,
  validateBody(processPaymentSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await BillingAnalyticsService.processPayment(
        req.params.billingId,
        req.body.payment_amount,
        req.body.payment_method,
        req.body.transaction_id,
        req.user!.role as UserRole,
        req.user!.id
      );

      res.json({
        message: 'Payment processed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/billing-analytics/client/:clientId
 * Get billing summary for a client
 */
router.get(
  '/client/:clientId',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const result = await BillingAnalyticsService.getClientBillingSummary(
        req.params.clientId,
        req.user!.role as UserRole
      );

      res.json({
        message: 'Client billing summary retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/billing-analytics/master-dashboard
 * Get master admin analytics dashboard
 */
router.get(
  '/master-dashboard',
  authenticateToken,
  requireMasterAdmin,
  validateQuery(analyticsFiltersSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const filters = {
        dateRange: req.query.start_date && req.query.end_date ? {
          start: new Date(req.query.start_date as string),
          end: new Date(req.query.end_date as string),
        } : undefined,
        clientId: req.query.client_id as string,
        billingType: req.query.billing_type as string,
        status: req.query.status as string,
      };

      const result = await BillingAnalyticsService.getMasterAnalytics(
        filters,
        req.user!.role as UserRole
      );

      res.json({
        message: 'Master analytics dashboard retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/billing-analytics/payment-methods
 * Get payment methods analytics
 */
router.get(
  '/payment-methods',
  authenticateToken,
  requireMasterAdmin,
  async (req: AuthRequest, res, next) => {
    try {
      const result = await BillingAnalyticsService.getPaymentMethodsAnalytics(
        req.user!.role as UserRole
      );

      res.json({
        message: 'Payment methods analytics retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/billing-analytics/report
 * Generate billing report
 */
router.get(
  '/report',
  authenticateToken,
  requireMasterAdmin,
  validateQuery(analyticsFiltersSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const filters = {
        dateRange: req.query.start_date && req.query.end_date ? {
          start: new Date(req.query.start_date as string),
          end: new Date(req.query.end_date as string),
        } : undefined,
        clientId: req.query.client_id as string,
        billingType: req.query.billing_type as string,
        status: req.query.status as string,
      };

      const result = await BillingAnalyticsService.generateBillingReport(
        filters,
        req.user!.role as UserRole
      );

      res.json({
        message: 'Billing report generated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/billing-analytics/revenue-trends
 * Get revenue trends over time
 */
router.get(
  '/revenue-trends',
  authenticateToken,
  requireMasterAdmin,
  async (req: AuthRequest, res, next) => {
    try {
      // Get last 12 months of data
      const trends = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        // Get credit purchases for this month
        const monthlyPurchases = await prisma.creditPurchase.findMany({
          where: {
            created_at: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          include: {
            client_instance: {
              select: {
                client_name: true,
                client_code: true,
              },
            },
          },
        });

        const monthlyRevenue = monthlyPurchases.reduce((sum, purchase) => sum + purchase.total_cost, 0);
        const monthlyCredits = monthlyPurchases.reduce((sum, purchase) => sum + purchase.credits_purchased, 0);

        trends.push({
          month: startOfMonth.toISOString().slice(0, 7),
          revenue: monthlyRevenue,
          credits: monthlyCredits,
          purchases: monthlyPurchases.length,
          topClients: monthlyPurchases
            .sort((a, b) => b.total_cost - a.total_cost)
            .slice(0, 3)
            .map(p => ({
              clientName: p.client_instance.client_name,
              amount: p.total_cost,
            })),
        });
      }

      res.json({
        message: 'Revenue trends retrieved successfully',
        data: trends,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
