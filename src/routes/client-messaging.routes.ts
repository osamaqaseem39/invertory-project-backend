import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { ClientMessagingService } from '../services/client-messaging.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import {
  createMessageSchema,
  respondToMessageSchema,
  updateMessageStatusSchema,
  messageQueryFiltersSchema,
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
 * POST /api/v1/client-messaging/messages
 * Create a new message from client to master admin
 */
router.post(
  '/messages',
  authenticateToken,
  validateBody(createMessageSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const message = await ClientMessagingService.createMessage({
        clientInstanceId: req.body.client_instance_id,
        messageType: req.body.message_type,
        subject: req.body.subject,
        messageContent: req.body.message_content,
        priority: req.body.priority,
        actorId: req.user!.id,
      });

      res.status(201).json({
        message: 'Message created successfully',
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/client-messaging/messages
 * Get messages with filters (master admin only)
 */
router.get(
  '/messages',
  authenticateToken,
  requireMasterAdmin,
  validateQuery(messageQueryFiltersSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const filters = {
        clientInstanceId: req.query.client_instance_id as string,
        messageType: req.query.message_type as any,
        status: req.query.status as any,
        priority: req.query.priority as any,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        dateRange: req.query.start_date && req.query.end_date ? {
          start: new Date(req.query.start_date as string),
          end: new Date(req.query.end_date as string),
        } : undefined,
      };

      const result = await ClientMessagingService.getMessages(
        filters,
        req.user!.role as UserRole
      );

      res.json({
        message: 'Messages retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/client-messaging/messages/:id
 * Get message by ID (master admin only)
 */
router.get(
  '/messages/:id',
  authenticateToken,
  requireMasterAdmin,
  async (req: AuthRequest, res, next) => {
    try {
      const message = await ClientMessagingService.getMessageById(
        req.params.id,
        req.user!.role as UserRole
      );

      res.json({
        message: 'Message retrieved successfully',
        data: message,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/client-messaging/messages/:id/respond
 * Respond to a message (master admin only)
 */
router.post(
  '/messages/:id/respond',
  authenticateToken,
  requireMasterAdmin,
  validateBody(respondToMessageSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const updatedMessage = await ClientMessagingService.respondToMessage({
        messageId: req.params.id,
        responseContent: req.body.response_content,
        actorId: req.user!.id,
        actorRole: req.user!.role as UserRole,
      });

      res.json({
        message: 'Message response sent successfully',
        data: updatedMessage,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/client-messaging/messages/:id/status
 * Update message status (master admin only)
 */
router.patch(
  '/messages/:id/status',
  authenticateToken,
  requireMasterAdmin,
  validateBody(updateMessageStatusSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const updatedMessage = await ClientMessagingService.updateMessageStatus(
        req.params.id,
        req.body.status,
        req.user!.role as UserRole,
        req.user!.id
      );

      res.json({
        message: `Message status updated to ${req.body.status} successfully`,
        data: updatedMessage,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/client-messaging/stats
 * Get message statistics for master dashboard
 */
router.get(
  '/stats',
  authenticateToken,
  requireMasterAdmin,
  async (req: AuthRequest, res, next) => {
    try {
      const stats = await ClientMessagingService.getMessageStats(
        req.user!.role as UserRole
      );

      res.json({
        message: 'Message statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/client-messaging/unread-count
 * Get unread message count for master admin
 */
router.get(
  '/unread-count',
  authenticateToken,
  requireMasterAdmin,
  async (req: AuthRequest, res, next) => {
    try {
      const count = await ClientMessagingService.getUnreadMessageCount(
        req.user!.role as UserRole
      );

      res.json({
        message: 'Unread message count retrieved successfully',
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
