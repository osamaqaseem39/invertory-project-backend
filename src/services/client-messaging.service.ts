import { UserRole } from '@prisma/client';
import { ConflictError, NotFoundError, AuthorizationError } from '../utils/errors';
import { RBACService } from './rbac.service';
import logger from '../utils/logger';
import prisma from '../database/client';

export interface CreateMessageParams {
  clientInstanceId: string;
  messageType: string;
  subject: string;
  messageContent: string;
  priority?: string;
  actorId: string;
}

export interface RespondToMessageParams {
  messageId: string;
  responseContent: string;
  actorId: string;
  actorRole: UserRole;
}

export interface MessageFilters {
  clientInstanceId?: string;
  messageType?: string;
  status?: string;
  priority?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Client Messaging Service
 * Handles communication between master admin and clients
 */
export class ClientMessagingService {
  /**
   * Create a new message from client to master admin
   */
  static async createMessage(params: CreateMessageParams): Promise<any> {
    // Verify client instance exists
    const client = await prisma.clientInstance.findUnique({
      where: { id: params.clientInstanceId },
    });

    if (!client) {
      throw new NotFoundError('Client instance');
    }

    // Create message
    const message = await prisma.clientMessage.create({
      data: {
        client_instance_id: params.clientInstanceId,
        message_type: params.messageType,
        subject: params.subject,
        message_content: params.messageContent,
        priority: params.priority || 'MEDIUM',
        status: 'PENDING',
      },
      include: {
        client_instance: {
          select: {
            id: true,
            client_name: true,
            client_code: true,
            contact_email: true,
            status: true,
          },
        },
      },
    });

    // Create notification for master admin
    await prisma.clientNotification.create({
      data: {
        client_instance_id: params.clientInstanceId,
        notification_type: 'NEW_MESSAGE',
        title: `New ${params.messageType.replace('_', ' ').toLowerCase()} message`,
        message: `${client.client_name}: ${params.subject}`,
      },
    });

    logger.info({
      messageId: message.id,
      clientId: params.clientInstanceId,
      messageType: params.messageType,
      actorId: params.actorId,
    }, 'Client message created');

    return message;
  }

  /**
   * Respond to a client message (master admin only)
   */
  static async respondToMessage(params: RespondToMessageParams): Promise<any> {
    // Enforce RBAC: Can actor respond to messages?
    RBACService.enforceCanRespondToMessages(params.actorRole);

    // Get the message
    const message = await prisma.clientMessage.findUnique({
      where: { id: params.messageId },
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

    if (!message) {
      throw new NotFoundError('Message');
    }

    // Update message with response
    const updatedMessage = await prisma.clientMessage.update({
      where: { id: params.messageId },
      data: {
        response_content: params.responseContent,
        responded_by_id: params.actorId,
        responded_at: new Date(),
        status: 'RESOLVED',
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
        responded_by: {
          select: {
            id: true,
            username: true,
            display_name: true,
          },
        },
      },
    });

    // Create notification for client
    await prisma.clientNotification.create({
      data: {
        client_instance_id: message.client_instance_id,
        notification_type: 'MESSAGE_RESPONSE',
        title: 'Message Response Received',
        message: `Your message "${message.subject}" has been responded to.`,
      },
    });

    logger.info({
      messageId: params.messageId,
      clientId: message.client_instance_id,
      actorId: params.actorId,
    }, 'Message response sent');

    return updatedMessage;
  }

  /**
   * Get messages with filters (master admin only)
   */
  static async getMessages(
    filters: MessageFilters,
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

    if (filters.messageType) {
      where.message_type = filters.messageType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { message_content: { contains: filters.search, mode: 'insensitive' } },
        { response_content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.dateRange) {
      where.created_at = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    const [messages, total] = await Promise.all([
      prisma.clientMessage.findMany({
        where,
        include: {
          client_instance: {
            select: {
              id: true,
              client_name: true,
              client_code: true,
              contact_email: true,
              status: true,
            },
          },
          responded_by: {
            select: {
              id: true,
              username: true,
              display_name: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.clientMessage.count({ where }),
    ]);

    return {
      data: messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get message by ID
   */
  static async getMessageById(
    messageId: string,
    actorRole: UserRole
  ): Promise<any> {
    // Enforce RBAC: Can actor view client data?
    RBACService.enforceCanViewClientData(actorRole);

    const message = await prisma.clientMessage.findUnique({
      where: { id: messageId },
      include: {
        client_instance: {
          select: {
            id: true,
            client_name: true,
            client_code: true,
            contact_email: true,
            status: true,
          },
        },
        responded_by: {
          select: {
            id: true,
            username: true,
            display_name: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundError('Message');
    }

    return message;
  }

  /**
   * Update message status
   */
  static async updateMessageStatus(
    messageId: string,
    status: MessageStatus,
    actorRole: UserRole,
    actorId: string
  ): Promise<any> {
    // Enforce RBAC: Can actor respond to messages?
    RBACService.enforceCanRespondToMessages(actorRole);

    const message = await prisma.clientMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundError('Message');
    }

    const updatedMessage = await prisma.clientMessage.update({
      where: { id: messageId },
      data: { status },
      include: {
        client_instance: {
          select: {
            id: true,
            client_name: true,
            client_code: true,
            contact_email: true,
          },
        },
        responded_by: {
          select: {
            id: true,
            username: true,
            display_name: true,
          },
        },
      },
    });

    logger.info({
      messageId,
      oldStatus: message.status,
      newStatus: status,
      actorId,
    }, 'Message status updated');

    return updatedMessage;
  }

  /**
   * Get message statistics for master dashboard
   */
  static async getMessageStats(actorRole: UserRole): Promise<any> {
    // Enforce RBAC: Can actor view client data?
    RBACService.enforceCanViewClientData(actorRole);

    const [
      totalMessages,
      pendingMessages,
      resolvedMessages,
      messagesByType,
      messagesByPriority,
      recentMessages,
    ] = await Promise.all([
      prisma.clientMessage.count(),
      prisma.clientMessage.count({ where: { status: 'PENDING' } }),
      prisma.clientMessage.count({ where: { status: 'RESOLVED' } }),
      prisma.clientMessage.groupBy({
        by: ['message_type'],
        _count: { message_type: true },
      }),
      prisma.clientMessage.groupBy({
        by: ['priority'],
        _count: { priority: true },
      }),
      prisma.clientMessage.findMany({
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
      totalMessages,
      pendingMessages,
      resolvedMessages,
      messagesByType: messagesByType.reduce((acc, item) => {
        acc[item.message_type] = item._count.message_type;
        return acc;
      }, {} as Record<string, number>),
      messagesByPriority: messagesByPriority.reduce((acc, item) => {
        acc[item.priority] = item._count.priority;
        return acc;
      }, {} as Record<string, number>),
      recentMessages,
    };
  }

  /**
   * Get unread message count for master admin
   */
  static async getUnreadMessageCount(actorRole: UserRole): Promise<number> {
    // Enforce RBAC: Can actor view client data?
    RBACService.enforceCanViewClientData(actorRole);

    return await prisma.clientMessage.count({
      where: { status: 'PENDING' },
    });
  }
}
