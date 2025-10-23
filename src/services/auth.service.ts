import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, AuditAction } from '@prisma/client';
import prisma from '../database/client';
import config from '../config';
import { hashPassword, verifyPassword } from '../utils/password';
import { AuthenticationError, NotFoundError } from '../utils/errors';
import { AuditService } from './audit.service';
import logger from '../utils/logger';

interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthContext {
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  /**
   * Generate JWT access token
   */
  private static generateAccessToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiry,
      issuer: 'user-management-system',
      audience: 'user-management-api',
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  private static generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Hash refresh token for storage
   */
  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Verify JWT access token
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.jwt.accessSecret, {
        issuer: 'user-management-system',
        audience: 'user-management-api',
      }) as JWTPayload;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  /**
   * Login user
   */
  static async login(
    identifier: string,
    password: string,
    context: AuthContext
  ): Promise<{ user: Omit<User, 'password_hash'>; tokens: TokenPair }> {
    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier },
        ],
      },
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new AuthenticationError('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(user.password_hash, password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();
    const tokenHash = this.hashToken(refreshToken);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        user_agent: context.userAgent,
        ip_address: context.ipAddress,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    // Audit log
    await AuditService.createLog({
      actorUserId: user.id,
      action: AuditAction.LOGIN,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger.info({ userId: user.id, username: user.username }, 'User logged in');

    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(
    refreshToken: string,
    context: AuthContext
  ): Promise<TokenPair> {
    const tokenHash = this.hashToken(refreshToken);

    // Find refresh token
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Check if expired
    if (storedToken.expires_at < new Date()) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new AuthenticationError('Refresh token expired');
    }

    // Check if user is still active
    if (!storedToken.user.is_active) {
      throw new AuthenticationError('Account is inactive');
    }

    // Generate new tokens (rotate refresh token)
    const accessToken = this.generateAccessToken(storedToken.user);
    const newRefreshToken = this.generateRefreshToken();
    const newTokenHash = this.hashToken(newRefreshToken);

    // Delete old refresh token and create new one
    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { id: storedToken.id } }),
      prisma.refreshToken.create({
        data: {
          user_id: storedToken.user.id,
          token_hash: newTokenHash,
          user_agent: context.userAgent,
          ip_address: context.ipAddress,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    // Audit log
    await AuditService.createLog({
      actorUserId: storedToken.user.id,
      action: AuditAction.REFRESH_TOKEN,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user
   */
  static async logout(userId: string, refreshToken: string, context: AuthContext): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);

    // Delete refresh token
    await prisma.refreshToken.deleteMany({
      where: {
        user_id: userId,
        token_hash: tokenHash,
      },
    });

    // Audit log
    await AuditService.createLog({
      actorUserId: userId,
      action: AuditAction.LOGOUT,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger.info({ userId }, 'User logged out');
  }

  /**
   * Change password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    context: AuthContext
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(user.password_hash, currentPassword);
    if (!isPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: newPasswordHash },
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { user_id: userId } });

    // Audit log
    await AuditService.createLog({
      actorUserId: userId,
      targetUserId: userId,
      action: AuditAction.PASSWORD_RESET,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger.info({ userId }, 'Password changed successfully');
  }

  /**
   * Forgot password (generates token - email service mock)
   */
  static async forgotPassword(email: string): Promise<{ resetToken: string }> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal if user exists
      logger.warn({ email }, 'Forgot password requested for non-existent email');
      return { resetToken: 'mock-token' };
    }

    // Generate reset token (in production, store in DB with expiry)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // TODO: Send email with reset token
    logger.info({ userId: user.id, email }, 'Password reset token generated (mock)');

    return { resetToken };
  }

  /**
   * Reset password (with token)
   */
  static async resetPassword(_token: string, _newPassword: string): Promise<void> {
    // TODO: Implement token validation from DB
    // For now, mock implementation
    logger.warn('Reset password called (mock implementation)');
    throw new Error('Reset password not fully implemented - use change password instead');
  }

  /**
   * Clean up expired refresh tokens
   */
  static async cleanupExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });

    logger.info({ count: result.count }, 'Expired refresh tokens cleaned up');
    return result.count;
  }
}

