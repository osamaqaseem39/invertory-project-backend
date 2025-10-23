import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { ClientSyncService } from '../services/client-sync.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import {
  createMessageSchema,
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

// Custom schemas for sync operations
const syncMessageSchema = createMessageSchema; // Reuse the same schema
const syncStatusSchema = {
  body: {
    status: { type: 'string', required: true },
    device_info: { type: 'object', required: false },
  }
};
const heartbeatSchema = {
  body: {
    device_info: { type: 'object', required: false },
  }
};

/**
 * POST /api/v1/client-sync/message
 * Sync a message from client to master
 */
router.post(
  '/message',
  authenticateToken,
  validateBody(syncMessageSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await ClientSyncService.syncMessage({
        clientInstanceId: req.body.client_instance_id,
        messageType: req.body.message_type,
        subject: req.body.subject,
        messageContent: req.body.message_content,
        priority: req.body.priority,
        actorId: req.user!.id,
      });

      if (result.success) {
        res.status(200).json({
          message: 'Message synced successfully',
          data: result.message,
          syncStatus: result.syncStatus,
        });
      } else {
        res.status(202).json({
          message: 'Message sync failed, queued for offline processing',
          error: result.error,
          syncStatus: result.syncStatus,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/client-sync/status
 * Update client sync status
 */
router.post(
  '/status',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const client = await ClientSyncService.updateSyncStatus({
        clientInstanceId: req.body.client_instance_id,
        status: req.body.status,
        lastSeenAt: new Date(),
        deviceInfo: req.body.device_info,
        actorId: req.user!.id,
      });

      res.json({
        message: 'Client sync status updated successfully',
        data: client,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/client-sync/heartbeat
 * Handle client heartbeat
 */
router.post(
  '/heartbeat',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const result = await ClientSyncService.handleHeartbeat({
        clientInstanceId: req.body.client_instance_id,
        deviceInfo: req.body.device_info,
        actorId: req.user!.id,
      });

      res.json({
        message: 'Heartbeat processed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/client-sync/status/:clientId
 * Get sync status for a specific client
 */
router.get(
  '/status/:clientId',
  authenticateToken,
  requireMasterAdmin,
  async (req: AuthRequest, res, next) => {
    try {
      const result = await ClientSyncService.getSyncStatus(
        req.params.clientId,
        req.user!.role as UserRole
      );

      res.json({
        message: 'Client sync status retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/client-sync/status
 * Get sync status for all clients (master admin only)
 */
router.get(
  '/status',
  authenticateToken,
  requireMasterAdmin,
  async (req: AuthRequest, res, next) => {
    try {
      const result = await ClientSyncService.getAllClientsSyncStatus(
        req.user!.role as UserRole
      );

      res.json({
        message: 'All clients sync status retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/client-sync/process-queue/:clientId
 * Process offline queue for a client (master admin only)
 */
router.post(
  '/process-queue/:clientId',
  authenticateToken,
  requireMasterAdmin,
  async (req: AuthRequest, res, next) => {
    try {
      const result = await ClientSyncService.processOfflineQueue(
        req.params.clientId,
        req.user!.role as UserRole
      );

      res.json({
        message: 'Offline queue processed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/client-sync/queue-message
 * Queue message for offline processing
 */
router.post(
  '/queue-message',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const result = await ClientSyncService.queueOfflineMessage({
        clientInstanceId: req.body.client_instance_id,
        messageType: req.body.message_type,
        data: req.body.data,
        priority: req.body.priority,
        actorId: req.user!.id,
      });

      res.json({
        message: 'Message queued for offline processing successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
