import prisma from '../database/client';
import { DatabaseIsolationService } from './database-isolation.service';
import logger from '../utils/logger';
import crypto from 'crypto';

interface LicenseKey {
  id: string;
  licenseKey: string;
  clientId: string;
  deviceFingerprint: string;
  licenseType: string;
  creditsIncluded: number;
  durationMonths: number;
  isUsed: boolean;
  usedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  createdBy: string;
}

interface LicenseActivationRequest {
  clientId: string;
  deviceFingerprint: string;
  contactEmail: string;
  contactPhone?: string;
  companyName?: string;
  country?: string;
  message?: string;
}

export class LicenseManagementService {
  private static readonly LICENSE_TYPES = {
    'STARTER': { credits: 1000, duration: 1, price: 100 },
    'BUSINESS': { credits: 5000, duration: 12, price: 500 },
    'PROFESSIONAL': { credits: 10000, duration: 12, price: 1000 },
    'ENTERPRISE': { credits: 50000, duration: 12, price: 5000 },
  };

  /**
   * Generate a unique license key
   */
  static generateLicenseKey(): string {
    // Generate 32-character alphanumeric license key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Create a license key for a client
   */
  static async createLicenseKey(
    clientId: string,
    licenseType: string,
    deviceFingerprint: string,
    contactEmail: string,
    createdBy: string,
    customCredits?: number,
    customDuration?: number
  ): Promise<LicenseKey> {
    try {
      // Validate license type
      if (!this.LICENSE_TYPES[licenseType as keyof typeof this.LICENSE_TYPES]) {
        throw new Error(`Invalid license type: ${licenseType}`);
      }

      const licenseConfig = this.LICENSE_TYPES[licenseType as keyof typeof this.LICENSE_TYPES];
      const credits = customCredits || licenseConfig.credits;
      const duration = customDuration || licenseConfig.duration;

      // Generate unique license key
      let licenseKey: string;
      let isUnique = false;
      let attempts = 0;

      do {
        licenseKey = this.generateLicenseKey();
        const existing = await prisma.enhancedLicenseKey.findUnique({
          where: { license_key: licenseKey }
        });
        isUnique = !existing;
        attempts++;
      } while (!isUnique && attempts < 10);

      if (!isUnique) {
        throw new Error('Failed to generate unique license key');
      }

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + duration);

      // Create license key in master database
      const license = await prisma.enhancedLicenseKey.create({
        data: {
          license_key: licenseKey,
          license_type: licenseType,
          status: 'PENDING',
          device_fingerprint: deviceFingerprint,
          customer_email: contactEmail,
          max_credits: credits,
          current_credits: credits,
          expires_at: expiresAt,
          activation_count: 0,
          max_activations: 1,
          created_by_id: createdBy,
        }
      });

      // Create license record in master admin system
      const licenseRecord = await prisma.clientInstance.update({
        where: { id: clientId },
        data: {
          license_key_id: license.id,
          status: 'ACTIVE'
        }
      });

      logger.info(`✅ License key created: ${licenseKey} for client ${clientId}`);

      return {
        id: license.id,
        licenseKey: license.license_key,
        clientId: clientId,
        deviceFingerprint: deviceFingerprint,
        licenseType: licenseType,
        creditsIncluded: credits,
        durationMonths: duration,
        isUsed: false,
        expiresAt: expiresAt,
        createdAt: license.created_at,
        createdBy: createdBy
      };

    } catch (error) {
      logger.error(`❌ Failed to create license key for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Activate license key
   */
  static async activateLicenseKey(
    licenseKey: string,
    deviceFingerprint: string,
    clientId: string
  ): Promise<{ success: boolean; message: string; credits?: number }> {
    try {
      // Find license key
      const license = await prisma.enhancedLicenseKey.findUnique({
        where: { license_key: licenseKey }
      });

      if (!license) {
        return {
          success: false,
          message: 'License key not found'
        };
      }

      // Check if license is already used
      if (license.status === 'ACTIVE' && license.activation_count > 0) {
        return {
          success: false,
          message: 'License key has already been used'
        };
      }

      // Check if license is expired
      if (license.expires_at && new Date() > license.expires_at) {
        return {
          success: false,
          message: 'License key has expired'
        };
      }

      // Check device fingerprint match
      if (license.device_fingerprint !== deviceFingerprint) {
        return {
          success: false,
          message: 'License key is not valid for this device'
        };
      }

      // Activate license
      await prisma.enhancedLicenseKey.update({
        where: { id: license.id },
        data: {
          status: 'ACTIVE',
          activated_at: new Date(),
          activation_count: license.activation_count + 1
        }
      });

      // Activate license in client database
      const clientDb = DatabaseIsolationService.getClientDatabase(clientId);
      await clientDb.$executeRaw`
        UPDATE trial_sessions 
        SET 
          license_key = ${licenseKey},
          activated_at = CURRENT_TIMESTAMP,
          is_active = true
        WHERE client_id = ${clientId} AND device_fingerprint = ${deviceFingerprint}
      `;

      logger.info(`✅ License key activated: ${licenseKey} for client ${clientId}`);

      return {
        success: true,
        message: 'License activated successfully',
        credits: license.max_credits
      };

    } catch (error) {
      logger.error(`❌ Failed to activate license key ${licenseKey}:`, error);
      throw error;
    }
  }

  /**
   * Get license key details
   */
  static async getLicenseKeyDetails(licenseKey: string): Promise<LicenseKey | null> {
    try {
      const license = await prisma.enhancedLicenseKey.findUnique({
        where: { license_key: licenseKey },
        include: {
          created_by: {
            select: {
              username: true,
              email: true
            }
          }
        }
      });

      if (!license) {
        return null;
      }

      return {
        id: license.id,
        licenseKey: license.license_key,
        clientId: license.client_instance_id || '',
        deviceFingerprint: license.device_fingerprint || '',
        licenseType: license.license_type,
        creditsIncluded: license.max_credits || 0,
        durationMonths: license.expires_at ? 
          Math.ceil((license.expires_at.getTime() - license.created_at.getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0,
        isUsed: license.activation_count > 0,
        usedAt: license.activated_at,
        expiresAt: license.expires_at || new Date(),
        createdAt: license.created_at,
        createdBy: license.created_by?.username || 'Unknown'
      };

    } catch (error) {
      logger.error(`❌ Failed to get license key details for ${licenseKey}:`, error);
      throw error;
    }
  }

  /**
   * Revoke license key
   */
  static async revokeLicenseKey(
    licenseKey: string,
    reason: string,
    revokedBy: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const license = await prisma.enhancedLicenseKey.findUnique({
        where: { license_key: licenseKey }
      });

      if (!license) {
        return {
          success: false,
          message: 'License key not found'
        };
      }

      // Revoke license
      await prisma.enhancedLicenseKey.update({
        where: { id: license.id },
        data: {
          status: 'REVOKED',
          is_revoked: true,
          revoked_at: new Date(),
          revocation_reason: reason
        }
      });

      logger.info(`✅ License key revoked: ${licenseKey} by ${revokedBy}`);

      return {
        success: true,
        message: 'License key revoked successfully'
      };

    } catch (error) {
      logger.error(`❌ Failed to revoke license key ${licenseKey}:`, error);
      throw error;
    }
  }

  /**
   * Get license key statistics
   */
  static async getLicenseStatistics(): Promise<{
    totalLicenses: number;
    activeLicenses: number;
    expiredLicenses: number;
    revokedLicenses: number;
    totalRevenue: number;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
  }> {
    try {
      const totalLicenses = await prisma.enhancedLicenseKey.count();
      const activeLicenses = await prisma.enhancedLicenseKey.count({
        where: { status: 'ACTIVE' }
      });
      const expiredLicenses = await prisma.enhancedLicenseKey.count({
        where: {
          expires_at: { lt: new Date() },
          status: 'ACTIVE'
        }
      });
      const revokedLicenses = await prisma.enhancedLicenseKey.count({
        where: { status: 'REVOKED' }
      });

      // Calculate revenue (simplified for MVP)
      const totalRevenue = 0; // This would calculate from billing records
      const monthlyRevenue = []; // This would calculate monthly revenue

      return {
        totalLicenses,
        activeLicenses,
        expiredLicenses,
        revokedLicenses,
        totalRevenue,
        monthlyRevenue
      };

    } catch (error) {
      logger.error(`❌ Failed to get license statistics:`, error);
      throw error;
    }
  }

  /**
   * Process license activation request
   */
  static async processLicenseActivationRequest(
    request: LicenseActivationRequest,
    processedBy: string
  ): Promise<{ success: boolean; message: string; licenseKey?: string }> {
    try {
      // Create activation request record
      const activationRequest = await prisma.clientMessage.create({
        data: {
          client_instance_id: request.clientId,
          message_type: 'CREDIT_REQUEST',
          subject: 'License Activation Request',
          content: `License activation request from ${request.contactEmail}. ${request.message || ''}`,
          priority: 'HIGH',
          status: 'PENDING',
          created_by_id: processedBy
        }
      });

      // Generate license key
      const licenseKey = await this.createLicenseKey(
        request.clientId,
        'BUSINESS', // Default license type
        request.deviceFingerprint,
        request.contactEmail,
        processedBy
      );

      logger.info(`✅ License activation request processed for client ${request.clientId}`);

      return {
        success: true,
        message: 'License activation request processed successfully',
        licenseKey: licenseKey.licenseKey
      };

    } catch (error) {
      logger.error(`❌ Failed to process license activation request:`, error);
      throw error;
    }
  }

  /**
   * Get license key pricing
   */
  static getLicensePricing(): Record<string, { credits: number; duration: number; price: number }> {
    return this.LICENSE_TYPES;
  }

  /**
   * Validate license key format
   */
  static validateLicenseKeyFormat(licenseKey: string): boolean {
    // License key should be 32 characters, alphanumeric, uppercase
    return /^[A-Z0-9]{32}$/.test(licenseKey);
  }

  /**
   * Check license key status
   */
  static async checkLicenseKeyStatus(licenseKey: string): Promise<{
    isValid: boolean;
    status: string;
    message: string;
    expiresAt?: Date;
    creditsRemaining?: number;
  }> {
    try {
      const license = await prisma.enhancedLicenseKey.findUnique({
        where: { license_key: licenseKey }
      });

      if (!license) {
        return {
          isValid: false,
          status: 'NOT_FOUND',
          message: 'License key not found'
        };
      }

      if (license.status === 'REVOKED') {
        return {
          isValid: false,
          status: 'REVOKED',
          message: 'License key has been revoked'
        };
      }

      if (license.expires_at && new Date() > license.expires_at) {
        return {
          isValid: false,
          status: 'EXPIRED',
          message: 'License key has expired',
          expiresAt: license.expires_at
        };
      }

      return {
        isValid: true,
        status: license.status,
        message: 'License key is valid',
        expiresAt: license.expires_at,
        creditsRemaining: license.current_credits
      };

    } catch (error) {
      logger.error(`❌ Failed to check license key status:`, error);
      throw error;
    }
  }
}
