import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { RBACService } from '../services/rbac.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../database/client';

const router = Router();

/**
 * GET /me
 * Get current user profile
 */
router.get(
  '/',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          username: true,
          email: true,
          display_name: true,
          role: true,
          is_active: true,
          created_by_id: true,
          created_at: true,
          updated_at: true,
          last_login_at: true,
        },
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /me/permissions
 * Get current user's permissions
 */
router.get(
  '/permissions',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const role = req.user!.role as UserRole;

      const permissions = {
        can_create_users: RBACService.getAllowedCreationRoles(role).length > 0,
        can_list_users: RBACService.canListUsers(role),
        can_delete_users: RBACService.canDelete(role),
        can_change_roles: RBACService.canChangeRole(role),
        can_change_status: RBACService.canChangeStatus(role),
        can_view_audit_logs: RBACService.canViewAuditLogs(role),
        allowed_creation_roles: RBACService.getAllowedCreationRoles(role),
      };

      res.json(permissions);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

