import prisma from '../database/client';
import { DatabaseIsolationService } from './database-isolation.service';
import { TrialSystemService } from './trial-system.service';
import { LicenseManagementService } from './license-management.service';
import logger from '../utils/logger';
import crypto from 'crypto';

interface ClientOnboardingRequest {
  clientName: string;
  contactEmail: string;
  contactPhone?: string;
  companyName?: string;
  country?: string;
  timezone?: string;
  deviceFingerprint: string;
  hardwareSignature: string;
}

interface ClientOnboardingResult {
  success: boolean;
  clientId: string;
  clientCode: string;
  databaseConfig: any;
  trialSession: any;
  message: string;
}

export class ClientOnboardingService {
  /**
   * Generate unique client code
   */
  private static generateClientCode(): string {
    const prefix = 'CLIENT';
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `${prefix}-${randomPart}-${suffix}`;
  }

  /**
   * Generate device fingerprint
   */
  private static generateDeviceFingerprint(): string {
    // This would typically be generated on the client side
    // For MVP, we'll generate a unique identifier
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Complete client onboarding process
   */
  static async onboardClient(
    request: ClientOnboardingRequest,
    createdBy: string
  ): Promise<ClientOnboardingResult> {
    try {
      logger.info(`🚀 Starting client onboarding for: ${request.clientName}`);

      // Step 1: Create client instance in master database
      const clientInstance = await prisma.clientInstance.create({
        data: {
          client_name: request.clientName,
          client_code: this.generateClientCode(),
          device_fingerprint: request.deviceFingerprint,
          hardware_signature: request.hardwareSignature,
          status: 'TRIAL',
          contact_email: request.contactEmail,
          contact_phone: request.contactPhone,
          company_name: request.companyName,
          country: request.country,
          timezone: request.timezone,
          created_by_id: createdBy,
        }
      });

      logger.info(`✅ Client instance created: ${clientInstance.id}`);

      // Step 2: Create separate database for client
      const databaseConfig = await DatabaseIsolationService.createClientDatabase(clientInstance.id);
      
      logger.info(`✅ Client database created: ${databaseConfig.databaseName}`);

      // Step 3: Initialize trial session
      const trialSession = await TrialSystemService.initializeTrialSession(
        clientInstance.id,
        request.deviceFingerprint
      );

      logger.info(`✅ Trial session initialized with 50 credits`);

      // Step 4: Create welcome message
      await prisma.clientMessage.create({
        data: {
          client_instance_id: clientInstance.id,
          message_type: 'STATUS_UPDATE',
          subject: 'Welcome to POS System',
          content: `Welcome ${request.clientName}! Your trial account has been created with 50 credits. You can start using the POS system immediately. Contact us when you need more credits or want to upgrade to a full license.`,
          priority: 'MEDIUM',
          status: 'PENDING',
          created_by_id: createdBy
        }
      });

      logger.info(`✅ Welcome message created`);

      // Step 5: Create initial notification
      await prisma.clientNotification.create({
        data: {
          client_instance_id: clientInstance.id,
          title: 'Account Created Successfully',
          message: 'Your POS system is ready to use! You have 50 trial credits to get started.',
          type: 'INFO',
          is_read: false
        }
      });

      logger.info(`✅ Initial notification created`);

      logger.info(`🎉 Client onboarding completed successfully for: ${request.clientName}`);

      return {
        success: true,
        clientId: clientInstance.id,
        clientCode: clientInstance.client_code,
        databaseConfig,
        trialSession,
        message: 'Client onboarded successfully'
      };

    } catch (error) {
      logger.error(`❌ Failed to onboard client:`, error);
      throw error;
    }
  }

  /**
   * Get client onboarding status
   */
  static async getOnboardingStatus(clientId: string): Promise<{
    isOnboarded: boolean;
    clientInfo: any;
    databaseStatus: string;
    trialStatus: any;
    licenseStatus: any;
  }> {
    try {
      // Get client info
      const clientInfo = await prisma.clientInstance.findUnique({
        where: { id: clientId },
        include: {
          license_key: true,
          messages: {
            orderBy: { created_at: 'desc' },
            take: 5
          },
          notifications: {
            orderBy: { created_at: 'desc' },
            take: 5
          }
        }
      });

      if (!clientInfo) {
        return {
          isOnboarded: false,
          clientInfo: null,
          databaseStatus: 'NOT_FOUND',
          trialStatus: null,
          licenseStatus: null
        };
      }

      // Check database status
      let databaseStatus = 'UNKNOWN';
      try {
        const dbInfo = await DatabaseIsolationService.getClientDatabaseInfo(clientId);
        databaseStatus = dbInfo ? 'ACTIVE' : 'INACTIVE';
      } catch (error) {
        databaseStatus = 'ERROR';
      }

      // Get trial status
      let trialStatus = null;
      try {
        trialStatus = await TrialSystemService.getTrialStatus(clientId, clientInfo.device_fingerprint);
      } catch (error) {
        logger.warn(`Failed to get trial status for client ${clientId}:`, error);
      }

      // Get license status
      let licenseStatus = null;
      if (clientInfo.license_key_id) {
        try {
          licenseStatus = await LicenseManagementService.getLicenseKeyDetails(clientInfo.license_key?.license_key || '');
        } catch (error) {
          logger.warn(`Failed to get license status for client ${clientId}:`, error);
        }
      }

      return {
        isOnboarded: true,
        clientInfo,
        databaseStatus,
        trialStatus,
        licenseStatus
      };

    } catch (error) {
      logger.error(`❌ Failed to get onboarding status for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Process license upgrade request
   */
  static async processLicenseUpgradeRequest(
    clientId: string,
    licenseType: string,
    contactInfo: {
      email: string;
      phone?: string;
      message?: string;
    },
    processedBy: string
  ): Promise<{ success: boolean; message: string; licenseKey?: string }> {
    try {
      // Get client info
      const client = await prisma.clientInstance.findUnique({
        where: { id: clientId }
      });

      if (!client) {
        throw new Error('Client not found');
      }

      // Create upgrade request message
      await prisma.clientMessage.create({
        data: {
          client_instance_id: clientId,
          message_type: 'CREDIT_REQUEST',
          subject: 'License Upgrade Request',
          content: `License upgrade request to ${licenseType} from ${contactInfo.email}. Message: ${contactInfo.message || 'No additional message'}`,
          priority: 'HIGH',
          status: 'PENDING',
          created_by_id: processedBy
        }
      });

      // Generate license key
      const licenseKey = await LicenseManagementService.createLicenseKey(
        clientId,
        licenseType,
        client.device_fingerprint,
        contactInfo.email,
        processedBy
      );

      // Create notification
      await prisma.clientNotification.create({
        data: {
          client_instance_id: clientId,
          title: 'License Upgrade Request Processed',
          message: `Your license upgrade request has been processed. License key: ${licenseKey.licenseKey}`,
          type: 'SUCCESS',
          is_read: false
        }
      });

      logger.info(`✅ License upgrade request processed for client ${clientId}`);

      return {
        success: true,
        message: 'License upgrade request processed successfully',
        licenseKey: licenseKey.licenseKey
      };

    } catch (error) {
      logger.error(`❌ Failed to process license upgrade request:`, error);
      throw error;
    }
  }

  /**
   * Get client dashboard data
   */
  static async getClientDashboardData(clientId: string): Promise<{
    clientInfo: any;
    trialStatus: any;
    licenseStatus: any;
    recentActivity: any;
    creditHistory: any;
    systemStatus: any;
  }> {
    try {
      // Get client info
      const clientInfo = await prisma.clientInstance.findUnique({
        where: { id: clientId },
        include: {
          license_key: true,
          usage_stats: {
            orderBy: { date: 'desc' },
            take: 30
          }
        }
      });

      if (!clientInfo) {
        throw new Error('Client not found');
      }

      // Get trial status
      const trialStatus = await TrialSystemService.getTrialStatus(clientId, clientInfo.device_fingerprint);

      // Get license status
      let licenseStatus = null;
      if (clientInfo.license_key_id) {
        licenseStatus = await LicenseManagementService.getLicenseKeyDetails(clientInfo.license_key?.license_key || '');
      }

      // Get recent activity
      const recentActivity = await prisma.clientMessage.findMany({
        where: { client_instance_id: clientId },
        orderBy: { created_at: 'desc' },
        take: 10
      });

      // Get credit history
      const creditHistory = await TrialSystemService.getCreditHistory(clientId, clientInfo.device_fingerprint, 20);

      // Get system status
      const systemStatus = {
        database: 'ACTIVE',
        api: 'ACTIVE',
        sync: 'ACTIVE',
        lastSync: new Date()
      };

      return {
        clientInfo,
        trialStatus,
        licenseStatus,
        recentActivity,
        creditHistory,
        systemStatus
      };

    } catch (error) {
      logger.error(`❌ Failed to get client dashboard data:`, error);
      throw error;
    }
  }

  /**
   * Deactivate client
   */
  static async deactivateClient(
    clientId: string,
    reason: string,
    deactivatedBy: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Update client status
      await prisma.clientInstance.update({
        where: { id: clientId },
        data: {
          status: 'SUSPENDED',
          updated_at: new Date()
        }
      });

      // Create deactivation message
      await prisma.clientMessage.create({
        data: {
          client_instance_id: clientId,
          message_type: 'STATUS_UPDATE',
          subject: 'Account Deactivated',
          content: `Your account has been deactivated. Reason: ${reason}`,
          priority: 'HIGH',
          status: 'PENDING',
          created_by_id: deactivatedBy
        }
      });

      // Create notification
      await prisma.clientNotification.create({
        data: {
          client_instance_id: clientId,
          title: 'Account Deactivated',
          message: `Your account has been deactivated. Reason: ${reason}`,
          type: 'WARNING',
          is_read: false
        }
      });

      logger.info(`✅ Client deactivated: ${clientId} by ${deactivatedBy}`);

      return {
        success: true,
        message: 'Client deactivated successfully'
      };

    } catch (error) {
      logger.error(`❌ Failed to deactivate client:`, error);
      throw error;
    }
  }

  /**
   * Reactivate client
   */
  static async reactivateClient(
    clientId: string,
    reactivatedBy: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Update client status
      await prisma.clientInstance.update({
        where: { id: clientId },
        data: {
          status: 'ACTIVE',
          updated_at: new Date()
        }
      });

      // Create reactivation message
      await prisma.clientMessage.create({
        data: {
          client_instance_id: clientId,
          message_type: 'STATUS_UPDATE',
          subject: 'Account Reactivated',
          content: 'Your account has been reactivated. You can now use the POS system again.',
          priority: 'MEDIUM',
          status: 'PENDING',
          created_by_id: reactivatedBy
        }
      });

      // Create notification
      await prisma.clientNotification.create({
        data: {
          client_instance_id: clientId,
          title: 'Account Reactivated',
          message: 'Your account has been reactivated. Welcome back!',
          type: 'SUCCESS',
          is_read: false
        }
      });

      logger.info(`✅ Client reactivated: ${clientId} by ${reactivatedBy}`);

      return {
        success: true,
        message: 'Client reactivated successfully'
      };

    } catch (error) {
      logger.error(`❌ Failed to reactivate client:`, error);
      throw error;
    }
  }

  /**
   * Get onboarding statistics
   */
  static async getOnboardingStatistics(): Promise<{
    totalClients: number;
    activeClients: number;
    trialClients: number;
    licensedClients: number;
    suspendedClients: number;
    newClientsThisMonth: number;
    newClientsThisWeek: number;
  }> {
    try {
      const totalClients = await prisma.clientInstance.count();
      const activeClients = await prisma.clientInstance.count({
        where: { status: 'ACTIVE' }
      });
      const trialClients = await prisma.clientInstance.count({
        where: { status: 'TRIAL' }
      });
      const licensedClients = await prisma.clientInstance.count({
        where: { license_key_id: { not: null } }
      });
      const suspendedClients = await prisma.clientInstance.count({
        where: { status: 'SUSPENDED' }
      });

      // Calculate new clients this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const newClientsThisMonth = await prisma.clientInstance.count({
        where: {
          created_at: { gte: startOfMonth }
        }
      });

      // Calculate new clients this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const newClientsThisWeek = await prisma.clientInstance.count({
        where: {
          created_at: { gte: startOfWeek }
        }
      });

      return {
        totalClients,
        activeClients,
        trialClients,
        licensedClients,
        suspendedClients,
        newClientsThisMonth,
        newClientsThisWeek
      };

    } catch (error) {
      logger.error(`❌ Failed to get onboarding statistics:`, error);
      throw error;
    }
  }
}
