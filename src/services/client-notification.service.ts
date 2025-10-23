import { UserRole } from '@prisma/client';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { RBACService } from './rbac.service';
import logger from '../utils/logger';
import prisma from '../database/client';

export interface CreateNotificationParams {
  clientInstanceId: string;
  notificationType: string;
  title: string;
  message: string;
  actorId?: string;
}

export interface NotificationFilters {
  clientInstanceId?: string;
  notificationType?: string;
  isRead?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Client Notification Service
 * Handles notifications for clients
 */
export class ClientNotificationService {
  /**
   * Create a notification for a client
   */
  static async createNotification(params: CreateNotificationParams): Promise<any> {
    // Verify client instance exists
    const client = await prisma.clientInstance.findUnique({
      where: { id: params.clientInstanceId },
    });

    if (!client) {
      throw new NotFoundError('Client instance');
    }

    // Create notification
    const notification = await prisma.clientNotification.create({
      data: {
        client_instance_id: params.clientInstanceId,
        notification_type: params.notificationType,
        title: params.title,
        message: params.message,
        is_read: false,
      },
      include: {
        client_instance: {
          select: {
            id: true,
            client_name: true,
            client_code: true,
            contact_email: true,
          },
        },
      },
    });

    logger.info({
      notificationId: notification.id,
      clientId: params.clientInstanceId,
      notificationType: params.notificationType,
      actorId: params.actorId,
    }, 'Client notification created');

    return notification;
  }

  /**
   * Get notifications for a specific client
   */
  static async getClientNotifications(
    clientInstanceId: string,
    filters: Omit<NotificationFilters, 'clientInstanceId'> = {},
    actorRole?: UserRole
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // If actor role is provided, enforce RBAC
    if (actorRole) {
      RBACService.enforceCanViewClientData(actorRole);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      client_instance_id: clientInstanceId,
    };

    // Apply filters
    if (filters.notificationType) {
      where.notification_type = filters.notificationType;
    }

    if (filters.isRead !== undefined) {
      where.is_read = filters.isRead;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { message: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.dateRange) {
      where.created_at = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    const [notifications, total] = await Promise.all([
      prisma.clientNotification.findMany({
        where,
        include: {
          client_instance: {
            select: {
              id: true,
              client_name: true,
              client_code: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.clientNotification.count({ where }),
    ]);

    return {
      data: notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all notifications with filters (master admin only)
   */
  static async getAllNotifications(
    filters: NotificationFilters,
    actorRole: UserRole
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Enforce RBAC: Can actor view client data?
    RBACService.enforceCanViewClientData(actorRole);

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Apply filters
    if (filters.clientInstanceId) {
      where.client_instance_id = filters.clientInstanceId;
    }

    if (filters.notificationType) {
      where.notification_type = filters.notificationType;
    }

    if (filters.isRead !== undefined) {
      where.is_read = filters.isRead;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { message: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.dateRange) {
      where.created_at = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    const [notifications, total] = await Promise.all([
      prisma.clientNotification.findMany({
        where,
        include: {
          client_instance: {
            select: {
              id: true,
              client_name: true,
              client_code: true,
              contact_email: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.clientNotification.count({ where }),
    ]);

    return {
      data: notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(
    notificationId: string,
    actorRole?: UserRole
  ): Promise<any> {
    // If actor role is provided, enforce RBAC
    if (actorRole) {
      RBACService.enforceCanViewClientData(actorRole);
    }

    const notification = await prisma.clientNotification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundError('Notification');
    }

    const updatedNotification = await prisma.clientNotification.update({
      where: { id: notificationId },
      data: { is_read: true },
      include: {
        client_instance: {
          select: {
            id: true,
            client_name: true,
            client_code: true,
          },
        },
      },
    });

    logger.info({
      notificationId,
      actorRole,
    }, 'Notification marked as read');

    return updatedNotification;
  }

  /**
   * Mark all notifications as read for a client
   */
  static async markAllAsReadForClient(
    clientInstanceId: string,
    actorRole?: UserRole
  ): Promise<number> {
    // If actor role is provided, enforce RBAC
    if (actorRole) {
      RBACService.enforceCanViewClientData(actorRole);
    }

    const result = await prisma.clientNotification.updateMany({
      where: {
        client_instance_id: clientInstanceId,
        is_read: false,
      },
      data: { is_read: true },
    });

    logger.info({
      clientId: clientInstanceId,
      count: result.count,
      actorRole,
    }, 'All notifications marked as read for client');

    return result.count;
  }

  /**
   * Get unread notification count for a client
   */
  static async getUnreadCountForClient(
    clientInstanceId: string,
    actorRole?: UserRole
  ): Promise<number> {
    // If actor role is provided, enforce RBAC
    if (actorRole) {
      RBACService.enforceCanViewClientData(actorRole);
    }

    return await prisma.clientNotification.count({
      where: {
        client_instance_id: clientInstanceId,
        is_read: false,
      },
    });
  }

  /**
   * Get notification statistics for master dashboard
   */
  static async getNotificationStats(actorRole: UserRole): Promise<any> {
    // Enforce RBAC: Can actor view client data?
    RBACService.enforceCanViewClientData(actorRole);

    const [
      totalNotifications,
      unreadNotifications,
      notificationsByType,
      recentNotifications,
    ] = await Promise.all([
      prisma.clientNotification.count(),
      prisma.clientNotification.count({ where: { is_read: false } }),
      prisma.clientNotification.groupBy({
        by: ['notification_type'],
        _count: { notification_type: true },
      }),
      prisma.clientNotification.findMany({
        where: { is_read: false },
        orderBy: { created_at: 'desc' },
        take: 5,
        include: {
          client_instance: {
            select: {
              client_name: true,
              client_code: true,
            },
          },
        },
      }),
    ]);

    return {
      totalNotifications,
      unreadNotifications,
      notificationsByType: notificationsByType.reduce((acc, item) => {
        acc[item.notification_type] = item._count.notification_type;
        return acc;
      }, {} as Record<string, number>),
      recentNotifications,
    };
  }

  /**
   * Delete old notifications (cleanup)
   */
  static async cleanupOldNotifications(
    olderThanDays: number = 30,
    actorRole: UserRole
  ): Promise<number> {
    // Enforce RBAC: Can actor manage clients?
    RBACService.enforceCanManageClients(actorRole);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.clientNotification.deleteMany({
      where: {
        created_at: { lt: cutoffDate },
        is_read: true, // Only delete read notifications
      },
    });

    logger.info({
      deletedCount: result.count,
      cutoffDate,
      actorRole,
    }, 'Old notifications cleaned up');

    return result.count;
  }
}
