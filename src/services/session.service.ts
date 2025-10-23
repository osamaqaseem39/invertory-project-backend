import { RefreshToken, UserRole } from '@prisma/client';
import prisma from '../database/client';
import { AuthorizationError, NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

interface SessionInfo extends RefreshToken {
  is_current?: boolean;
  device_name?: string;
}

export class SessionService {
  /**
   * Get user's active sessions
   */
  static async getUserSessions(
    userId: string,
    actorId: string,
    actorRole: UserRole,
    currentTokenHash?: string
  ): Promise<SessionInfo[]> {
    // Check if actor can view this user's sessions
    if (actorId !== userId) {
      // Only owner can view other users' sessions
      if (actorRole !== UserRole.owner_ultimate_super_admin) {
        throw new AuthorizationError('You can only view your own sessions');
      }
    }

    const sessions = await prisma.refreshToken.findMany({
      where: {
        user_id: userId,
        expires_at: { gt: new Date() }, // Only active sessions
      },
      orderBy: { created_at: 'desc' },
    });

    // Enrich with device info and current session flag
    return sessions.map(session => ({
      ...session,
      is_current: currentTokenHash ? session.token_hash === currentTokenHash : false,
      device_name: this.parseDeviceName(session.user_agent || ''),
    }));
  }

  /**
   * Revoke a specific session
   */
  static async revokeSession(
    sessionId: string,
    actorId: string,
    actorRole: UserRole
  ): Promise<void> {
    const session = await prisma.refreshToken.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundError('Session');
    }

    // Check if actor can revoke this session
    if (session.user_id !== actorId) {
      // Only owner can revoke other users' sessions
      if (actorRole !== UserRole.owner_ultimate_super_admin) {
        throw new AuthorizationError('You can only revoke your own sessions');
      }
    }

    await prisma.refreshToken.delete({
      where: { id: sessionId },
    });

    logger.info({
      sessionId,
      userId: session.user_id,
      revokedBy: actorId,
    }, 'Session revoked');
  }

  /**
   * Revoke all sessions except current (logout all devices)
   */
  static async revokeAllSessions(
    userId: string,
    actorId: string,
    actorRole: UserRole,
    exceptTokenHash?: string
  ): Promise<number> {
    // Check if actor can revoke this user's sessions
    if (userId !== actorId) {
      if (actorRole !== UserRole.owner_ultimate_super_admin) {
        throw new AuthorizationError('You can only revoke your own sessions');
      }
    }

    const where: any = { user_id: userId };
    
    // Keep current session if provided
    if (exceptTokenHash) {
      where.token_hash = { not: exceptTokenHash };
    }

    const result = await prisma.refreshToken.deleteMany({ where });

    logger.info({
      userId,
      revokedBy: actorId,
      count: result.count,
    }, 'All sessions revoked');

    return result.count;
  }

  /**
   * Parse device name from user agent
   */
  private static parseDeviceName(userAgent: string): string {
    if (!userAgent) return 'Unknown Device';

    // Simple parsing - can be enhanced with user-agent library
    if (userAgent.includes('iPhone')) return '📱 Safari on iPhone';
    if (userAgent.includes('iPad')) return '📱 Safari on iPad';
    if (userAgent.includes('Android')) return '📱 Android Device';
    if (userAgent.includes('Macintosh') && userAgent.includes('Chrome')) return '💻 Chrome on MacOS';
    if (userAgent.includes('Macintosh') && userAgent.includes('Safari')) return '💻 Safari on MacOS';
    if (userAgent.includes('Macintosh')) return '💻 MacOS';
    if (userAgent.includes('Windows') && userAgent.includes('Chrome')) return '🖥️ Chrome on Windows';
    if (userAgent.includes('Windows') && userAgent.includes('Firefox')) return '🖥️ Firefox on Windows';
    if (userAgent.includes('Windows') && userAgent.includes('Edge')) return '🖥️ Edge on Windows';
    if (userAgent.includes('Windows')) return '🖥️ Windows';
    if (userAgent.includes('Linux')) return '🐧 Linux';
    
    return '🌐 ' + userAgent.substring(0, 30);
  }

  /**
   * Get user activity statistics
   */
  static async getUserActivityStats(userId: string): Promise<{
    totalLogins: number;
    loginsThisMonth: number;
    productsCreated: number;
    productsUpdated: number;
    lastLoginAt: Date | null;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalLogins, loginsThisMonth, productsCreated, productsUpdated, user] = await Promise.all([
      prisma.auditLog.count({
        where: {
          actor_user_id: userId,
          action: 'LOGIN',
        },
      }),
      prisma.auditLog.count({
        where: {
          actor_user_id: userId,
          action: 'LOGIN',
          created_at: { gte: thirtyDaysAgo },
        },
      }),
      prisma.product.count({
        where: { created_by_id: userId },
      }),
      prisma.auditLog.count({
        where: {
          actor_user_id: userId,
          action: 'UPDATE_PRODUCT',
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { last_login_at: true },
      }),
    ]);

    return {
      totalLogins,
      loginsThisMonth,
      productsCreated,
      productsUpdated,
      lastLoginAt: user?.last_login_at || null,
    };
  }
}

