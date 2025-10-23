import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { authLimiter } from '../middleware/rate-limit.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
} from '../validators/auth.validator';
import config from '../config';
import prisma from '../database/client';
import { hashPassword } from '../utils/password';
import { AuthenticationError, ConflictError } from '../utils/errors';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /auth/register
 * Bootstrap registration (creates first owner)
 */
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { username, email, display_name, password, bootstrap_token } = req.body;

      // Check if bootstrap is enabled
      if (!config.bootstrap.enabled) {
        throw new AuthenticationError('Registration is disabled');
      }

      // Check if any users exist
      const userCount = await prisma.user.count();
      if (userCount > 0) {
        throw new AuthenticationError('Registration is only available for first user');
      }

      // Verify bootstrap token
      if (bootstrap_token !== config.bootstrap.token) {
        throw new AuthenticationError('Invalid bootstrap token');
      }

      // Check for conflicts
      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ username }, { email }],
        },
      });

      if (existing) {
        throw new ConflictError(
          existing.username === username ? 'Username already exists' : 'Email already exists'
        );
      }

      // Create first owner
      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          username,
          email,
          display_name,
          password_hash: passwordHash,
          role: 'owner_ultimate_super_admin',
        },
      });

      logger.info({ userId: user.id, username }, '🎉 First owner created via bootstrap');

      const { password_hash, ...userWithoutPassword } = user;

      res.status(201).json({
        message: 'First owner created successfully',
        user: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/login
 * Login with email/username and password
 */
router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { identifier, password } = req.body;

      const result = await AuthService.login(identifier, password, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        message: 'Login successful',
        user: result.user,
        access_token: result.tokens.accessToken,
        refresh_token: result.tokens.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { refresh_token } = req.body;

      const tokens = await AuthService.refreshAccessToken(refresh_token, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        message: 'Token refreshed successfully',
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/logout
 * Logout and invalidate refresh token
 */
router.post(
  '/logout',
  authenticateToken,
  validateBody(refreshTokenSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { refresh_token } = req.body;

      await AuthService.logout(req.user!.id, refresh_token, {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/change-password
 * Change password (requires current password)
 */
router.post(
  '/change-password',
  authenticateToken,
  validateBody(changePasswordSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { current_password, new_password } = req.body;

      await AuthService.changePassword(
        req.user!.id,
        current_password,
        new_password,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );

      res.json({
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/forgot-password
 * Request password reset (mock email service)
 */
router.post(
  '/forgot-password',
  authLimiter,
  validateBody(forgotPasswordSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { email } = req.body;

      const result = await AuthService.forgotPassword(email);

      res.json({
        message: 'If the email exists, a reset link will be sent',
        reset_token: config.env === 'development' ? result.resetToken : undefined,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;





