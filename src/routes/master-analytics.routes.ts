import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireMasterAdmin } from '../middleware/rbac.middleware';
import { MasterAnalyticsSimpleService } from '../services/master-analytics-simple.service';
// import { z } from 'zod';

const router = Router();

// UUID parameter schema
// const clientIdParamSchema = z.object({
//   clientId: z.string().uuid()
// });

/**
 * GET /master-dashboard
 * Get comprehensive master dashboard analytics
 */
router.get(
  '/master-dashboard',
  authenticateToken,
  requireMasterAdmin,
  async (_req, res, next) => {
    try {
      const analytics = await MasterAnalyticsSimpleService.getMasterDashboard();
      res.status(200).json({
        message: 'Master dashboard analytics retrieved successfully',
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /client-analytics/:clientId
 * Get detailed analytics for a specific client
 */
router.get(
  '/client-analytics/:clientId',
  authenticateToken,
  requireMasterAdmin,
  async (req, res, next) => {
    try {
      const { clientId } = req.params;
      const analytics = await MasterAnalyticsSimpleService.getClientAnalytics(clientId);
      res.status(200).json({
        message: 'Client analytics retrieved successfully',
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /revenue-analytics
 * Get detailed revenue analytics
 */
router.get(
  '/revenue-analytics',
  authenticateToken,
  requireMasterAdmin,
  async (_req, res, next) => {
    try {
      const dashboard = await MasterAnalyticsSimpleService.getMasterDashboard();
      
      // Extract revenue-specific data
      const revenueAnalytics = {
        overview: {
          totalRevenue: dashboard.overview.totalRevenue,
          totalPaid: dashboard.overview.totalPaid,
          totalOutstanding: dashboard.overview.totalOutstanding,
          totalCreditRevenue: dashboard.overview.totalCreditRevenue
        },
        trends: {
          monthlyRevenue: dashboard.trends.monthlyRevenue,
          revenueGrowth: dashboard.trends.revenueGrowth
        },
        topClients: dashboard.topPerformers.clientsByRevenue,
        distributions: dashboard.distributions
      };

      res.status(200).json({
        message: 'Revenue analytics retrieved successfully',
        data: revenueAnalytics
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /client-performance
 * Get client performance metrics
 */
router.get(
  '/client-performance',
  authenticateToken,
  requireMasterAdmin,
  async (_req, res, next) => {
    try {
      const dashboard = await MasterAnalyticsSimpleService.getMasterDashboard();
      
      // Extract client performance data
      const performanceMetrics = {
        overview: {
          totalClients: dashboard.overview.totalClients,
          activeClients: dashboard.overview.activeClients,
          trialClients: dashboard.overview.trialClients,
          totalLicenses: dashboard.overview.totalLicenses,
          activeLicenses: dashboard.overview.activeLicenses
        },
        trends: {
          clientGrowth: dashboard.trends.clientGrowth
        },
        distributions: {
          clientStatuses: dashboard.distributions.clientStatuses,
          licenseTypes: dashboard.distributions.licenseTypes
        },
        topPerformers: {
          clientsByRevenue: dashboard.topPerformers.clientsByRevenue.slice(0, 5),
          recentClients: dashboard.topPerformers.recentClients
        }
      };

      res.status(200).json({
        message: 'Client performance metrics retrieved successfully',
        data: performanceMetrics
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /system-health
 * Get system health metrics
 */
router.get(
  '/system-health',
  authenticateToken,
  requireMasterAdmin,
  async (_req, res, next) => {
    try {
      const dashboard = await MasterAnalyticsSimpleService.getMasterDashboard();
      
      res.status(200).json({
        message: 'System health metrics retrieved successfully',
        data: {
          systemHealth: dashboard.systemHealth,
          recentActivity: dashboard.recentActivity
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
