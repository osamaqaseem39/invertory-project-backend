import { ClientStatus, UserRole } from '@prisma/client';
import { ConflictError, NotFoundError } from '../utils/errors';
import { RBACService } from './rbac.service';
import logger from '../utils/logger';
import prisma from '../database/client';

export interface CreateClientInstanceParams {
  clientName: string;
  deviceFingerprint: string;
  hardwareSignature: string;
  contactEmail: string;
  contactPhone?: string;
  companyName?: string;
  country?: string;
  timezone?: string;
  trialGuestId?: string;
  licenseKeyId?: string;
  createdById: string;
}

export interface UpdateClientInstanceParams {
  clientName?: string;
  status?: ClientStatus;
  contactEmail?: string;
  contactPhone?: string;
  companyName?: string;
  country?: string;
  timezone?: string;
  licenseKeyId?: string;
}

export interface ClientInstanceFilters {
  status?: ClientStatus;
  country?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  page?: number;
  limit?: number;
}

export interface ClientUsageStats {
  totalClients: number;
  activeClients: number;
  trialClients: number;
  totalCreditsConsumed: number;
  totalRevenue: number;
  recentClients: any[];
  topClientsByUsage: any[];
}

/**
 * Client Management Service
 * Handles multi-client distribution management
 */
export class ClientManagementService {
  /**
   * Generate unique client code
   */
  private static generateClientCode(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CLIENT-${timestamp}-${random}`;
  }

  /**
   * Register a new client instance
   */
  static async registerClientInstance(
    params: CreateClientInstanceParams,
    actorRole: UserRole
  ): Promise<any> {
    // Enforce RBAC: Can actor manage clients?
    RBACService.enforceCanManageClients(actorRole);

    // Check if device fingerprint already exists
    const existingClient = await prisma.clientInstance.findFirst({
      where: {
        OR: [
          { device_fingerprint: params.deviceFingerprint },
          { contact_email: params.contactEmail },
        ],
      },
    });

    if (existingClient) {
      if (existingClient.device_fingerprint === params.deviceFingerprint) {
        throw new ConflictError('Device fingerprint already registered');
      }
      if (existingClient.contact_email === params.contactEmail) {
        throw new ConflictError('Contact email already registered');
      }
    }

    // Generate client code
    const clientCode = this.generateClientCode();

    // Create client instance
    const client = await prisma.clientInstance.create({
      data: {
        client_name: params.clientName,
        client_code: clientCode,
        device_fingerprint: params.deviceFingerprint,
        hardware_signature: params.hardwareSignature,
        contact_email: params.contactEmail,
        contact_phone: params.contactPhone,
        company_name: params.companyName,
        country: params.country,
        timezone: params.timezone,
        trial_guest_id: params.trialGuestId,
        license_key_id: params.licenseKeyId,
        created_by_id: params.createdById,
        status: ClientStatus.TRIAL,
      },
      include: {
        created_by: {
          select: {
            id: true,
            username: true,
            display_name: true,
          },
        },
        license_key: {
          select: {
            license_key: true,
            license_type: true,
            status: true,
          },
        },
      },
    });

    logger.info({
      clientId: client.id,
      clientCode: client.client_code,
      createdBy: params.createdById,
    }, 'Client instance registered');

    return client;
  }

  /**
   * Get client instances with filters
   */
  static async getClientInstances(
    filters: ClientInstanceFilters,
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
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.country) {
      where.country = filters.country;
    }

    if (filters.search) {
      where.OR = [
        { client_name: { contains: filters.search, mode: 'insensitive' } },
        { client_code: { contains: filters.search, mode: 'insensitive' } },
        { contact_email: { contains: filters.search, mode: 'insensitive' } },
        { company_name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.dateRange) {
      where.created_at = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    const [clients, total] = await Promise.all([
      prisma.clientInstance.findMany({
        where,
        include: {
          created_by: {
            select: {
              id: true,
              username: true,
              display_name: true,
            },
          },
          license_key: {
            select: {
              license_key: true,
              license_type: true,
              status: true,
              expires_at: true,
            },
          },
          _count: {
            select: {
              messages: true,
              usage_stats: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.clientInstance.count({ where }),
    ]);

    return {
      data: clients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get client instance by ID
   */
  static async getClientInstanceById(
    clientId: string,
    actorRole: UserRole
  ): Promise<any> {
    // Enforce RBAC: Can actor view client data?
    RBACService.enforceCanViewClientData(actorRole);

    const client = await prisma.clientInstance.findUnique({
      where: { id: clientId },
      include: {
        created_by: {
          select: {
            id: true,
            username: true,
            display_name: true,
          },
        },
        license_key: {
          select: {
            license_key: true,
            license_type: true,
            status: true,
            expires_at: true,
            purchase_amount: true,
          },
        },
        usage_stats: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 10,
          include: {
            responded_by: {
              select: {
                id: true,
                username: true,
                display_name: true,
              },
            },
          },
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

    return client;
  }

  /**
   * Update client instance
   */
  static async updateClientInstance(
    clientId: string,
    updates: UpdateClientInstanceParams,
    actorRole: UserRole,
    actorId: string
  ): Promise<any> {
    // Enforce RBAC: Can actor manage clients?
    RBACService.enforceCanManageClients(actorRole);

    const client = await prisma.clientInstance.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundError('Client instance');
    }

    // Update client
    const updatedClient = await prisma.clientInstance.update({
      where: { id: clientId },
      data: updates,
      include: {
        created_by: {
          select: {
            id: true,
            username: true,
            display_name: true,
          },
        },
        license_key: {
          select: {
            license_key: true,
            license_type: true,
            status: true,
          },
        },
      },
    });

    logger.info({
      clientId,
      actorId,
      updates: Object.keys(updates),
    }, 'Client instance updated');

    return updatedClient;
  }

  /**
   * Update client status
   */
  static async updateClientStatus(
    clientId: string,
    status: ClientStatus,
    actorRole: UserRole,
    actorId: string
  ): Promise<any> {
    // Enforce RBAC: Can actor manage clients?
    RBACService.enforceCanManageClients(actorRole);

    const client = await prisma.clientInstance.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundError('Client instance');
    }

    // Update status
    const updatedClient = await prisma.clientInstance.update({
      where: { id: clientId },
      data: { status },
      include: {
        created_by: {
          select: {
            id: true,
            username: true,
            display_name: true,
          },
        },
        license_key: {
          select: {
            license_key: true,
            license_type: true,
            status: true,
          },
        },
      },
    });

    // Create notification for client
    await prisma.clientNotification.create({
      data: {
        client_instance_id: clientId,
        notification_type: 'STATUS_CHANGE',
        title: 'Account Status Updated',
        message: `Your account status has been updated to: ${status}`,
      },
    });

    logger.info({
      clientId,
      actorId,
      oldStatus: client.status,
      newStatus: status,
    }, 'Client status updated');

    return updatedClient;
  }

  /**
   * Get client usage statistics
   */
  static async getClientUsageStats(
    clientId: string,
    actorRole: UserRole
  ): Promise<any> {
    // Enforce RBAC: Can actor view client data?
    RBACService.enforceCanViewClientData(actorRole);

    const client = await prisma.clientInstance.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundError('Client instance');
    }

    // Get usage statistics
    const stats = await prisma.clientUsageStats.findMany({
      where: { client_instance_id: clientId },
      orderBy: { date: 'desc' },
      take: 90, // Last 90 days
    });

    // Calculate totals
    const totals = await prisma.clientUsageStats.aggregate({
      where: { client_instance_id: clientId },
      _sum: {
        credits_consumed: true,
        invoices_created: true,
        sales_amount: true,
        active_users: true,
        login_count: true,
        sync_count: true,
      },
      _avg: {
        credits_consumed: true,
        invoices_created: true,
        sales_amount: true,
        active_users: true,
      },
    });

    return {
      client,
      stats,
      totals,
    };
  }

  /**
   * Get master dashboard statistics
   */
  static async getMasterDashboardStats(actorRole: UserRole): Promise<ClientUsageStats> {
    // Enforce RBAC: Can actor view client data?
    RBACService.enforceCanViewClientData(actorRole);

    const [
      totalClients,
      activeClients,
      trialClients,
      usageStats,
      recentClients,
      topClientsByUsage,
    ] = await Promise.all([
      prisma.clientInstance.count(),
      prisma.clientInstance.count({ where: { status: ClientStatus.ACTIVE } }),
      prisma.clientInstance.count({ where: { status: ClientStatus.TRIAL } }),
      prisma.clientUsageStats.aggregate({
        _sum: {
          credits_consumed: true,
          sales_amount: true,
        },
      }),
      prisma.clientInstance.findMany({
        orderBy: { created_at: 'desc' },
        take: 5,
        include: {
          license_key: {
            select: {
              license_key: true,
              license_type: true,
            },
          },
        },
      }),
      prisma.clientInstance.findMany({
        orderBy: { last_seen_at: 'desc' },
        take: 5,
        include: {
          usage_stats: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    return {
      totalClients,
      activeClients,
      trialClients,
      totalCreditsConsumed: usageStats._sum.credits_consumed || 0,
      totalRevenue: Number(usageStats._sum.sales_amount) || 0,
      recentClients,
      topClientsByUsage,
    };
  }

  /**
   * Record client usage statistics
   */
  static async recordUsageStats(
    clientId: string,
    stats: {
      creditsConsumed?: number;
      invoicesCreated?: number;
      salesAmount?: number;
      activeUsers?: number;
      loginCount?: number;
      syncCount?: number;
    }
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get or create today's stats
    const existingStats = await prisma.clientUsageStats.findUnique({
      where: {
        client_instance_id_date: {
          client_instance_id: clientId,
          date: today,
        },
      },
    });

    if (existingStats) {
      // Update existing stats
      await prisma.clientUsageStats.update({
        where: { id: existingStats.id },
        data: {
          credits_consumed: { increment: stats.creditsConsumed || 0 },
          invoices_created: { increment: stats.invoicesCreated || 0 },
          sales_amount: { increment: stats.salesAmount || 0 },
          active_users: stats.activeUsers || existingStats.active_users,
          login_count: { increment: stats.loginCount || 0 },
          sync_count: { increment: stats.syncCount || 0 },
        },
      });
    } else {
      // Create new stats
      await prisma.clientUsageStats.create({
        data: {
          client_instance_id: clientId,
          date: today,
          credits_consumed: stats.creditsConsumed || 0,
          invoices_created: stats.invoicesCreated || 0,
          sales_amount: stats.salesAmount || 0,
          active_users: stats.activeUsers || 0,
          login_count: stats.loginCount || 0,
          sync_count: stats.syncCount || 0,
        },
      });
    }

    // Update last seen
    await prisma.clientInstance.update({
      where: { id: clientId },
      data: { last_seen_at: new Date() },
    });
  }
}
