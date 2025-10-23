import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { SessionService } from '../services/session.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { AuthorizationError } from '../utils/errors';
import crypto from 'crypto';

const router = Router();

/**
 * GET /sessions
 * Get current user's active sessions
 */
router.get(
  '/',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      // Get current token hash from header
      const authHeader = req.headers.authorization;
      const token = authHeader?.substring(7);
      const currentTokenHash = token ? crypto.createHash('sha256').update(token).digest('hex') : undefined;

      const sessions = await SessionService.getUserSessions(
        req.user!.id,
        req.user!.id,
        req.user!.role as UserRole,
        currentTokenHash
      );

      res.json({ sessions });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /sessions/:userId
 * Get another user's sessions (owner only)
 */
router.get(
  '/:userId',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const sessions = await SessionService.getUserSessions(
        req.params.userId,
        req.user!.id,
        req.user!.role as UserRole
      );

      res.json({ sessions });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /sessions/:sessionId
 * Revoke a specific session
 */
router.delete(
  '/:sessionId',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      await SessionService.revokeSession(
        req.params.sessionId,
        req.user!.id,
        req.user!.role as UserRole
      );

      res.json({ message: 'Session revoked successfully' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /sessions/revoke-all
 * Revoke all sessions except current
 */
router.post(
  '/revoke-all',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      // Get current token hash
      const authHeader = req.headers.authorization;
      const token = authHeader?.substring(7);
      const currentTokenHash = token ? crypto.createHash('sha256').update(token).digest('hex') : undefined;

      const count = await SessionService.revokeAllSessions(
        req.user!.id,
        req.user!.id,
        req.user!.role as UserRole,
        currentTokenHash
      );

      res.json({
        message: `${count} session(s) revoked successfully`,
        count,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /sessions/activity/:userId
 * Get user activity statistics
 */
router.get(
  '/activity/:userId',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const targetUserId = req.params.userId;
      const actorRole = req.user!.role as UserRole;

      // Check permissions
      if (targetUserId !== req.user!.id && actorRole !== UserRole.owner_ultimate_super_admin) {
        throw new AuthorizationError('You can only view your own activity');
      }

      const stats = await SessionService.getUserActivityStats(targetUserId);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

