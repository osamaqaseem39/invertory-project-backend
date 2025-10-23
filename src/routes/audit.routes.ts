import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { AuditService } from '../services/audit.service';
import { RBACService } from '../services/rbac.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { validateQuery } from '../middleware/validation.middleware';
import { listAuditLogsQuerySchema } from '../validators/audit.validator';

const router = Router();

/**
 * GET /audit
 * List audit logs (owner only)
 */
router.get(
  '/',
  authenticateToken,
  validateQuery(listAuditLogsQuerySchema),
  async (req: AuthRequest, res, next) => {
    try {
      // Enforce RBAC
      RBACService.enforceCanViewAuditLogs(req.user!.role as UserRole);

      const query = req.query as any;

      const result = await AuditService.listLogs({
        actorUserId: query.actor_user_id,
        targetUserId: query.target_user_id,
        action: query.action,
        startDate: query.start_date,
        endDate: query.end_date,
        page: query.page,
        limit: query.limit,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /audit/stats
 * Get audit statistics
 */
router.get(
  '/stats',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      // Enforce RBAC
      RBACService.enforceCanViewAuditLogs(req.user!.role as UserRole);

      const stats = await AuditService.getStatistics();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
);

export default router;





