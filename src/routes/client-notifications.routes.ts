import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { ClientNotificationService } from '../services/client-notification.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { validateQuery } from '../middleware/validation.middleware';
import { notificationQueryFiltersSchema } from '../validators/client-management.validator';

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
 * GET /api/v1/client-notifications
 * Get all notifications with filters (master admin only)
 */
router.get(
  '/',
  authenticateToken,
  requireMasterAdmin,
  validateQuery(notificationQueryFiltersSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const filters = {
        clientInstanceId: req.query.client_instance_id as string,
        notificationType: req.query.notification_type as string,
        isRead: req.query.is_read !== undefined ? req.query.is_read === 'true' : undefined,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        dateRange: req.query.start_date && req.query.end_date ? {
          start: new Date(req.query.start_date as string),
          end: new Date(req.query.end_date as string),
        } : undefined,
      };

      const result = await ClientNotificationService.getAllNotifications(
        filters,
        req.user!.role as UserRole
      );

      res.json({
        message: 'Notifications retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/client-notifications/client/:clientId
 * Get notifications for a specific client
 */
router.get(
  '/client/:clientId',
  authenticateToken,
  validateQuery(notificationQueryFiltersSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const filters = {
        notificationType: req.query.notification_type as string,
        isRead: req.query.is_read !== undefined ? req.query.is_read === 'true' : undefined,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        dateRange: req.query.start_date && req.query.end_date ? {
          start: new Date(req.query.start_date as string),
          end: new Date(req.query.end_date as string),
        } : undefined,
      };

      const result = await ClientNotificationService.getClientNotifications(
        req.params.clientId,
        filters,
        req.user!.role as UserRole
      );

      res.json({
        message: 'Client notifications retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/client-notifications/:id/read
 * Mark notification as read
 */
router.patch(
  '/:id/read',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const notification = await ClientNotificationService.markAsRead(
        req.params.id,
        req.user!.role as UserRole
      );

      res.json({
        message: 'Notification marked as read successfully',
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/client-notifications/client/:clientId/read-all
 * Mark all notifications as read for a client
 */
router.patch(
  '/client/:clientId/read-all',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const count = await ClientNotificationService.markAllAsReadForClient(
        req.params.clientId,
        req.user!.role as UserRole
      );

      res.json({
        message: `${count} notifications marked as read successfully`,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/client-notifications/client/:clientId/unread-count
 * Get unread notification count for a client
 */
router.get(
  '/client/:clientId/unread-count',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const count = await ClientNotificationService.getUnreadCountForClient(
        req.params.clientId,
        req.user!.role as UserRole
      );

      res.json({
        message: 'Unread notification count retrieved successfully',
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/client-notifications/stats
 * Get notification statistics for master dashboard
 */
router.get(
  '/stats',
  authenticateToken,
  requireMasterAdmin,
  async (req: AuthRequest, res, next) => {
    try {
      const stats = await ClientNotificationService.getNotificationStats(
        req.user!.role as UserRole
      );

      res.json({
        message: 'Notification statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/client-notifications/cleanup
 * Clean up old notifications (master admin only)
 */
router.delete(
  '/cleanup',
  authenticateToken,
  requireMasterAdmin,
  async (req: AuthRequest, res, next) => {
    try {
      const olderThanDays = req.query.days ? parseInt(req.query.days as string) : 30;
      
      const deletedCount = await ClientNotificationService.cleanupOldNotifications(
        olderThanDays,
        req.user!.role as UserRole
      );

      res.json({
        message: `${deletedCount} old notifications cleaned up successfully`,
        data: { deletedCount, olderThanDays },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
