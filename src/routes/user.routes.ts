import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { UserService } from '../services/user.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import {
  createUserSchema,
  updateUserSchema,
  updateStatusSchema,
  listUsersQuerySchema,
} from '../validators/user.validator';

const router = Router();

/**
 * GET /users
 * List users with filters and pagination
 */
router.get(
  '/',
  authenticateToken,
  validateQuery(listUsersQuerySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const query = req.query as any;

      const result = await UserService.listUsers(req.user!.role as UserRole, {
        q: query.q,
        role: query.role,
        isActive: query.is_active,
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
 * GET /users/stats
 * Get user statistics for dashboard
 */
router.get(
  '/stats',
  authenticateToken,
  async (_req: AuthRequest, res, next) => {
    try {
      const stats = await UserService.getUserStatistics();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /users/:id
 * Get user by ID
 */
router.get(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const user = await UserService.getUserById(
        req.params.id,
        req.user!.id,
        req.user!.role as UserRole
      );

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /users
 * Create a new user
 */
router.post(
  '/',
  authenticateToken,
  validateBody(createUserSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { username, email, display_name, password, role } = req.body;

      const user = await UserService.createUser(
        {
          username,
          email,
          display_name,
          password,
          role,
          createdById: req.user!.id,
        },
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );

      res.status(201).json({
        message: 'User created successfully',
        user,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /users/:id
 * Update user
 */
router.put(
  '/:id',
  authenticateToken,
  validateBody(updateUserSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const updates = req.body;

      const user = await UserService.updateUser(
        req.params.id,
        req.user!.id,
        req.user!.role as UserRole,
        updates,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );

      res.json({
        message: 'User updated successfully',
        user,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /users/:id/status
 * Activate/deactivate user
 */
router.patch(
  '/:id/status',
  authenticateToken,
  validateBody(updateStatusSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { is_active } = req.body;

      const user = await UserService.updateUserStatus(
        req.params.id,
        req.user!.id,
        req.user!.role as UserRole,
        is_active,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );

      res.json({
        message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
        user,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /users/:id
 * Delete user (soft delete)
 */
router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      await UserService.deleteUser(
        req.params.id,
        req.user!.id,
        req.user!.role as UserRole,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );

      res.json({
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

