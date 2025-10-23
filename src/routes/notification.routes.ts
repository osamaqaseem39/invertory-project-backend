import { Router } from 'express';
import { NotificationService, StockAlertService, NotificationPreferenceService } from '../services/notification.service';
import { StockMonitorService } from '../services/stock-monitor.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import {
  listNotificationsQuerySchema,
  configureAlertSchema,
  updatePreferencesSchema,
} from '../validators/notification.validator';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

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

/**
 * GET /api/v1/notifications
 * Get user's notifications
 */
router.get('/', validateQuery(listNotificationsQuerySchema), async (req: any, res) => {
  try {
    const result = await NotificationService.getUserNotifications(req.user.id, {
      isRead: req.query.isRead,
      type: req.query.type,
      priority: req.query.priority,
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'GET_NOTIFICATIONS_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * GET /api/v1/notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', async (req: any, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user.id);
    return res.status(200).json({ count });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'GET_UNREAD_COUNT_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', async (req: any, res) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id, req.user.id);
    return res.status(200).json({
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'MARK_READ_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * PATCH /api/v1/notifications/mark-all-read
 * Mark all notifications as read
 */
router.patch('/mark-all-read', async (req: any, res) => {
  try {
    const result = await NotificationService.markAllAsRead(req.user.id);
    return res.status(200).json({
      message: 'All notifications marked as read',
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'MARK_ALL_READ_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * DELETE /api/v1/notifications/:id
 * Dismiss notification
 */
router.delete('/:id', async (req: any, res) => {
  try {
    const notification = await NotificationService.dismissNotification(req.params.id);
    return res.status(200).json({
      message: 'Notification dismissed',
      data: notification,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'DISMISS_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/v1/notifications/stock-alerts/configure
 * Configure stock alert for a product
 * RBAC: owner, admin, inventory_manager
 */
router.post(
  '/stock-alerts/configure',
  requireRole([UserRole.owner_ultimate_super_admin, UserRole.admin, UserRole.inventory_manager]),
  validateBody(configureAlertSchema),
  async (req: any, res) => {
    try {
      const alert = await StockAlertService.configureAlert({
        ...req.body,
        createdById: req.user.id,
      });

      return res.status(201).json({
        message: 'Stock alert configured',
        data: alert,
      });
    } catch (error: any) {
      return res.status(400).json({
        error: {
          code: 'CONFIGURE_ALERT_FAILED',
          message: error.message,
        },
      });
    }
  }
);

/**
 * GET /api/v1/notifications/stock-alerts/product/:productId
 * Get stock alerts for a product
 */
router.get('/stock-alerts/product/:productId', async (req: any, res) => {
  try {
    const alerts = await StockAlertService.getProductAlerts(req.params.productId);
    return res.status(200).json({ data: alerts });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'GET_ALERTS_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/v1/notifications/stock-monitor/trigger
 * Manually trigger stock level check
 * RBAC: owner, admin, inventory_manager
 */
router.post(
  '/stock-monitor/trigger',
  requireRole([UserRole.owner_ultimate_super_admin, UserRole.admin, UserRole.inventory_manager]),
  async (_req: any, res) => {
    try {
      const result = await StockMonitorService.checkStockLevels();
      return res.status(200).json({
        message: 'Stock check completed',
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: {
          code: 'STOCK_CHECK_FAILED',
          message: error.message,
        },
      });
    }
  }
);

/**
 * GET /api/v1/notifications/stock-monitor/status
 * Get stock monitor service status
 */
router.get('/stock-monitor/status', async (_req: any, res) => {
  try {
    const status = StockMonitorService.getStatus();
    return res.status(200).json({ data: status });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'GET_STATUS_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * GET /api/v1/notifications/preferences
 * Get user's notification preferences
 */
router.get('/preferences', async (req: any, res) => {
  try {
    const preferences = await NotificationPreferenceService.getPreferences(req.user.id);
    return res.status(200).json({ data: preferences });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'GET_PREFERENCES_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * PATCH /api/v1/notifications/preferences
 * Update notification preferences
 */
router.patch('/preferences', validateBody(updatePreferencesSchema), async (req: any, res) => {
  try {
    const preferences = await NotificationPreferenceService.updatePreferences(req.user.id, req.body);
    return res.status(200).json({
      message: 'Preferences updated',
      data: preferences,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'UPDATE_PREFERENCES_FAILED',
        message: error.message,
      },
    });
  }
});

export default router;

