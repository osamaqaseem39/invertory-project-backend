import { AuditAction, AuditLog, Prisma } from '@prisma/client';
import prisma from '../database/client';
import logger from '../utils/logger';

interface CreateAuditLogParams {
  actorUserId: string;
  targetUserId?: string;
  action: AuditAction;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

interface ListAuditLogsParams {
  actorUserId?: string;
  targetUserId?: string;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class AuditService {
  /**
   * Create an audit log entry
   */
  static async createLog(params: CreateAuditLogParams): Promise<AuditLog> {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          actor_user_id: params.actorUserId,
          target_user_id: params.targetUserId,
          action: params.action,
          metadata: params.metadata || {},
          ip_address: params.ipAddress,
          user_agent: params.userAgent,
        },
      });

      logger.info({
        audit_id: auditLog.id,
        actor: params.actorUserId,
        action: params.action,
        target: params.targetUserId,
      }, 'Audit log created');

      return auditLog;
    } catch (error) {
      logger.error({ error, params }, 'Failed to create audit log');
      throw error;
    }
  }

  /**
   * List audit logs with filters
   */
  static async listLogs(params: ListAuditLogsParams): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (params.actorUserId) {
      where.actor_user_id = params.actorUserId;
    }

    if (params.targetUserId) {
      where.target_user_id = params.targetUserId;
    }

    if (params.action) {
      where.action = params.action;
    }

    if (params.startDate || params.endDate) {
      where.created_at = {};
      if (params.startDate) {
        where.created_at.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        where.created_at.lte = new Date(params.endDate);
      }
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              email: true,
              display_name: true,
              role: true,
            },
          },
          target: {
            select: {
              id: true,
              username: true,
              email: true,
              display_name: true,
              role: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get statistics for dashboard
   */
  static async getStatistics(): Promise<{
    totalLogs: number;
    recentActions: Record<AuditAction, number>;
    topActors: Array<{ user_id: string; username: string; count: number }>;
  }> {
    const [totalLogs, recentActions, topActors] = await Promise.all([
      prisma.auditLog.count(),
      
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: true,
        where: {
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
      
      prisma.$queryRaw<Array<{ actor_user_id: string; count: bigint }>>`
        SELECT actor_user_id, COUNT(*) as count
        FROM audit_logs
        GROUP BY actor_user_id
        ORDER BY count DESC
        LIMIT 10
      `,
    ]);

    const recentActionsMap: Record<string, number> = {};
    recentActions.forEach(item => {
      recentActionsMap[item.action] = item._count;
    });

    const topActorIds = topActors.map(a => a.actor_user_id);
    const actorUsers = await prisma.user.findMany({
      where: { id: { in: topActorIds } },
      select: { id: true, username: true },
    });

    const topActorsWithNames = topActors.map(actor => {
      const user = actorUsers.find(u => u.id === actor.actor_user_id);
      return {
        user_id: actor.actor_user_id,
        username: user?.username || 'Unknown',
        count: Number(actor.count),
      };
    });

    return {
      totalLogs,
      recentActions: recentActionsMap as Record<AuditAction, number>,
      topActors: topActorsWithNames,
    };
  }
}





