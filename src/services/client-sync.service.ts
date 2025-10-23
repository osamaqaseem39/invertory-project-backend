import { UserRole } from '@prisma/client';
import { NotFoundError, AuthorizationError, ConflictError } from '../utils/errors';
import { RBACService } from './rbac.service';
import logger from '../utils/logger';
import prisma from '../database/client';

export interface SyncMessageParams {
  clientInstanceId: string;
  messageType: string;
  subject: string;
  messageContent: string;
  priority?: string;
  actorId: string;
}

export interface SyncStatusParams {
  clientInstanceId: string;
  status: string;
  lastSeenAt: Date;
  deviceInfo?: any;
  actorId: string;
}

export interface HeartbeatParams {
  clientInstanceId: string;
  deviceInfo?: any;
  actorId: string;
}

export interface OfflineQueueParams {
  clientInstanceId: string;
  messageType: string;
  data: any;
  priority?: string;
  actorId: string;
}

/**
 * Client-to-Master Sync Service
 * Handles synchronization between client instances and master admin
 */
export class ClientSyncService {
  /**
   * Sync a message from client to master (with offline queue support)
   */
  static async syncMessage(params: SyncMessageParams): Promise<any> {
    // Verify client instance exists
    const client = await prisma.clientInstance.findUnique({
      where: { id: params.clientInstanceId },
    });

    if (!client) {
      throw new NotFoundError('Client instance');
    }

    try {
      // Create message directly
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

      // Update client last seen
      await prisma.clientInstance.update({
        where: { id: params.clientInstanceId },
        data: { last_seen_at: new Date() },
      });

      logger.info({
        messageId: message.id,
        clientId: params.clientInstanceId,
        messageType: params.messageType,
        actorId: params.actorId,
      }, 'Message synced successfully');

      return {
        success: true,
        message,
        syncStatus: 'SUCCESS',
      };
    } catch (error) {
      // If sync fails, queue for offline processing
      await this.queueOfflineMessage({
        clientInstanceId: params.clientInstanceId,
        messageType: 'SYNC_FAILED',
        data: {
          originalMessage: {
            messageType: params.messageType,
            subject: params.subject,
            messageContent: params.messageContent,
            priority: params.priority,
          },
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        priority: 'HIGH',
        actorId: params.actorId,
      });

      logger.error({
        clientId: params.clientInstanceId,
        error: error instanceof Error ? error.message : 'Unknown error',
        actorId: params.actorId,
      }, 'Message sync failed, queued for offline processing');

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        syncStatus: 'FAILED_QUEUED',
      };
    }
  }

  /**
   * Update client sync status
   */
  static async updateSyncStatus(params: SyncStatusParams): Promise<any> {
    // Verify client instance exists
    const client = await prisma.clientInstance.findUnique({
      where: { id: params.clientInstanceId },
    });

    if (!client) {
      throw new NotFoundError('Client instance');
    }

    // Update client status and last seen
    const updatedClient = await prisma.clientInstance.update({
      where: { id: params.clientInstanceId },
      data: {
        status: params.status as any,
        last_seen_at: params.lastSeenAt,
        last_sync_at: new Date(),
      },
      include: {
        usage_stats: {
          orderBy: { recorded_at: 'desc' },
          take: 1,
        },
      },
    });

    logger.info({
      clientId: params.clientInstanceId,
      status: params.status,
      actorId: params.actorId,
    }, 'Client sync status updated');

    return updatedClient;
  }

  /**
   * Handle client heartbeat
   */
  static async handleHeartbeat(params: HeartbeatParams): Promise<any> {
    // Verify client instance exists
    const client = await prisma.clientInstance.findUnique({
      where: { id: params.clientInstanceId },
    });

    if (!client) {
      throw new NotFoundError('Client instance');
    }

    // Update last seen and sync time
    const updatedClient = await prisma.clientInstance.update({
      where: { id: params.clientInstanceId },
      data: {
        last_seen_at: new Date(),
        last_sync_at: new Date(),
      },
    });

    // Check for pending messages/responses
    const pendingMessages = await prisma.clientMessage.count({
      where: {
        client_instance_id: params.clientInstanceId,
        status: 'RESOLVED',
        response_content: { not: null },
      },
    });

    const pendingNotifications = await prisma.clientNotification.count({
      where: {
        client_instance_id: params.clientInstanceId,
        is_read: false,
      },
    });

    logger.info({
      clientId: params.clientInstanceId,
      actorId: params.actorId,
    }, 'Client heartbeat processed');

    return {
      client: updatedClient,
      pendingMessages,
      pendingNotifications,
      heartbeatStatus: 'SUCCESS',
      timestamp: new Date(),
    };
  }

  /**
   * Queue message for offline processing
   */
  static async queueOfflineMessage(params: OfflineQueueParams): Promise<any> {
    // Verify client instance exists
    const client = await prisma.clientInstance.findUnique({
      where: { id: params.clientInstanceId },
    });

    if (!client) {
      throw new NotFoundError('Client instance');
    }

    // Create offline queue entry (using client_messages table for now)
    const queuedMessage = await prisma.clientMessage.create({
      data: {
        client_instance_id: params.clientInstanceId,
        message_type: params.messageType,
        subject: 'OFFLINE_QUEUE',
        message_content: JSON.stringify(params.data),
        priority: params.priority || 'MEDIUM',
        status: 'PENDING',
      },
    });

    logger.info({
      queueId: queuedMessage.id,
      clientId: params.clientInstanceId,
      messageType: params.messageType,
      actorId: params.actorId,
    }, 'Message queued for offline processing');

    return queuedMessage;
  }

  /**
   * Process offline queue for a client
   */
  static async processOfflineQueue(
    clientInstanceId: string,
    actorRole: UserRole
  ): Promise<any> {
    // Enforce RBAC: Can actor view client data?
    RBACService.enforceCanViewClientData(actorRole);

    // Get all pending offline messages for the client
    const offlineMessages = await prisma.clientMessage.findMany({
      where: {
        client_instance_id: clientInstanceId,
        subject: 'OFFLINE_QUEUE',
        status: 'PENDING',
      },
      orderBy: { created_at: 'asc' },
    });

    const processedMessages = [];
    const failedMessages = [];

    for (const message of offlineMessages) {
      try {
        const queueData = JSON.parse(message.message_content);
        
        // Process based on message type
        switch (message.message_type) {
          case 'SYNC_FAILED':
            // Retry the original message
            const originalMessage = queueData.originalMessage;
            if (originalMessage) {
              const retryResult = await this.syncMessage({
                clientInstanceId,
                messageType: originalMessage.messageType,
                subject: originalMessage.subject,
                messageContent: originalMessage.messageContent,
                priority: originalMessage.priority,
                actorId: message.client_instance_id, // Use client ID as actor
              });

              if (retryResult.success) {
                // Mark original queue message as resolved
                await prisma.clientMessage.update({
                  where: { id: message.id },
                  data: { status: 'RESOLVED' },
                });
                processedMessages.push(message.id);
              } else {
                failedMessages.push({ id: message.id, error: retryResult.error });
              }
            }
            break;

          default:
            // Mark as processed for unknown types
            await prisma.clientMessage.update({
              where: { id: message.id },
              data: { status: 'RESOLVED' },
            });
            processedMessages.push(message.id);
            break;
        }
      } catch (error) {
        failedMessages.push({ 
          id: message.id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    logger.info({
      clientId: clientInstanceId,
      processedCount: processedMessages.length,
      failedCount: failedMessages.length,
    }, 'Offline queue processed');

    return {
      processedMessages,
      failedMessages,
      totalProcessed: processedMessages.length,
      totalFailed: failedMessages.length,
    };
  }

  /**
   * Get sync status for a client
   */
  static async getSyncStatus(
    clientInstanceId: string,
    actorRole: UserRole
  ): Promise<any> {
    // Enforce RBAC: Can actor view client data?
    RBACService.enforceCanViewClientData(actorRole);

    const client = await prisma.clientInstance.findUnique({
      where: { id: clientInstanceId },
      include: {
        usage_stats: {
          orderBy: { recorded_at: 'desc' },
          take: 5,
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 5,
        },
        notifications: {
          where: { is_read: false },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundError('Client instance');
    }

    // Calculate sync health
    const now = new Date();
    const lastSeen = client.last_seen_at;
    const lastSync = client.last_sync_at;
    
    const timeSinceLastSeen = lastSeen ? now.getTime() - lastSeen.getTime() : Infinity;
    const timeSinceLastSync = lastSync ? now.getTime() - lastSync.getTime() : Infinity;
    
    const isOnline = timeSinceLastSeen < 5 * 60 * 1000; // 5 minutes
    const syncHealthy = timeSinceLastSync < 30 * 60 * 1000; // 30 minutes

    return {
      client,
      syncStatus: {
        isOnline,
        syncHealthy,
        lastSeenAt: lastSeen,
        lastSyncAt: lastSync,
        timeSinceLastSeen,
        timeSinceLastSync,
        pendingMessages: client.messages.filter(m => m.status === 'PENDING').length,
        unreadNotifications: client.notifications.length,
      },
    };
  }

  /**
   * Get all clients sync status (master admin only)
   */
  static async getAllClientsSyncStatus(actorRole: UserRole): Promise<any> {
    // Enforce RBAC: Can actor view client data?
    RBACService.enforceCanViewClientData(actorRole);

    const clients = await prisma.clientInstance.findMany({
      include: {
        usage_stats: {
          orderBy: { recorded_at: 'desc' },
          take: 1,
        },
        messages: {
          where: { status: 'PENDING' },
          select: { id: true },
        },
        notifications: {
          where: { is_read: false },
          select: { id: true },
        },
      },
    });

    const now = new Date();
    const syncStatuses = clients.map(client => {
      const lastSeen = client.last_seen_at;
      const lastSync = client.last_sync_at;
      
      const timeSinceLastSeen = lastSeen ? now.getTime() - lastSeen.getTime() : Infinity;
      const timeSinceLastSync = lastSync ? now.getTime() - lastSync.getTime() : Infinity;
      
      const isOnline = timeSinceLastSeen < 5 * 60 * 1000; // 5 minutes
      const syncHealthy = timeSinceLastSync < 30 * 60 * 1000; // 30 minutes

      return {
        clientId: client.id,
        clientName: client.client_name,
        clientCode: client.client_code,
        status: client.status,
        isOnline,
        syncHealthy,
        lastSeenAt: lastSeen,
        lastSyncAt: lastSync,
        pendingMessages: client.messages.length,
        unreadNotifications: client.notifications.length,
      };
    });

    return {
      totalClients: clients.length,
      onlineClients: syncStatuses.filter(s => s.isOnline).length,
      syncHealthyClients: syncStatuses.filter(s => s.syncHealthy).length,
      clients: syncStatuses,
    };
  }
}
