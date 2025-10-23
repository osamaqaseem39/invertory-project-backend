import { UserRole } from '@prisma/client';
import { NotFoundError, AuthorizationError, ConflictError } from '../utils/errors';
import { RBACService } from './rbac.service';
import logger from '../utils/logger';
import prisma from '../database/client';

export interface CreateLicenseParams {
  clientInstanceId: string;
  licenseType: string;
  durationMonths: number;
  maxCredits: number;
  features: string[];
  actorId: string;
}

export interface PurchaseCreditsParams {
  clientInstanceId: string;
  creditPack: string;
  amount: number;
  paymentMethod: string;
  actorId: string;
}

export interface LicenseActivationParams {
  licenseKey: string;
  deviceFingerprint: string;
  hardwareSignature: string;
  clientInfo: any;
}

/**
 * Advanced License Management Service
 * Handles licensing, credit purchases, and billing for multi-client system
 */
export class AdvancedLicenseService {
  /**
   * Create a new license for a client
   */
  static async createLicense(params: CreateLicenseParams): Promise<any> {
    // Enforce RBAC: Can actor manage clients?
    const user = await prisma.user.findUnique({ where: { id: params.actorId } });
    if (!user) throw new NotFoundError('User not found');
    RBACService.enforceCanManageClients(user.role);

    // Verify client instance exists
    const client = await prisma.clientInstance.findUnique({
      where: { id: params.clientInstanceId },
    });

    if (!client) {
      throw new NotFoundError('Client instance');
    }

    // Generate license key
    const licenseKey = this.generateLicenseKey();

    // Create license
    const license = await prisma.enhancedLicenseKey.create({
      data: {
        license_key: licenseKey,
        client_instance_id: params.clientInstanceId,
        license_type: params.licenseType,
        status: 'ACTIVE',
        max_credits: params.maxCredits,
        current_credits: params.maxCredits,
        features: params.features.join(','),
        expires_at: new Date(Date.now() + params.durationMonths * 30 * 24 * 60 * 60 * 1000),
        activation_count: 0,
        max_activations: 1,
        customer_email: client.contact_email,
        customer_name: client.client_name,
        company_name: client.company_name,
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

    // Update client status
    await prisma.clientInstance.update({
      where: { id: params.clientInstanceId },
      data: { 
        status: 'ACTIVE',
        license_key_id: license.id,
      },
    });

    // Create notification
    await prisma.clientNotification.create({
      data: {
        client_instance_id: params.clientInstanceId,
        notification_type: 'LICENSE_CREATED',
        title: 'License Created',
        message: `Your license has been created with ${params.maxCredits} credits. License Key: ${licenseKey}`,
      },
    });

    logger.info({
      licenseId: license.id,
      clientId: params.clientInstanceId,
      licenseKey,
      actorId: params.actorId,
    }, 'License created successfully');

    return license;
  }

  /**
   * Purchase credits for a client
   */
  static async purchaseCredits(params: PurchaseCreditsParams): Promise<any> {
    // Verify client instance exists
    const client = await prisma.clientInstance.findUnique({
      where: { id: params.clientInstanceId },
      include: {
        license_key: true,
      },
    });

    if (!client) {
      throw new NotFoundError('Client instance');
    }

    // Get license
    const license = client.license_key;
    if (!license) {
      throw new NotFoundError('License not found for client');
    }

    // Calculate credit pricing
    const creditPricing = this.getCreditPricing(params.creditPack);
    const totalCost = creditPricing.pricePerCredit * params.amount;

    // Create credit purchase record
    const purchase = await prisma.creditPurchase.create({
      data: {
        client_instance_id: params.clientInstanceId,
        credit_pack: params.creditPack,
        credits_purchased: params.amount,
        price_per_credit: creditPricing.pricePerCredit,
        total_cost: totalCost,
        payment_method: params.paymentMethod,
        status: 'PENDING',
      },
    });

    // Update license credits
    await prisma.enhancedLicenseKey.update({
      where: { id: license.id },
      data: {
        current_credits: license.current_credits + params.amount,
      },
    });

    // Create notification
    await prisma.clientNotification.create({
      data: {
        client_instance_id: params.clientInstanceId,
        notification_type: 'CREDITS_PURCHASED',
        title: 'Credits Purchased',
        message: `${params.amount} credits purchased for $${totalCost.toFixed(2)}. New balance: ${license.current_credits + params.amount}`,
      },
    });

    logger.info({
      purchaseId: purchase.id,
      clientId: params.clientInstanceId,
      credits: params.amount,
      cost: totalCost,
      actorId: params.actorId,
    }, 'Credits purchased successfully');

    return {
      purchase,
      newCreditBalance: license.current_credits + params.amount,
      totalCost,
    };
  }

  /**
   * Activate license for a client
   */
  static async activateLicense(params: LicenseActivationParams): Promise<any> {
    // Find license by key
    const license = await prisma.enhancedLicenseKey.findUnique({
      where: { license_key: params.licenseKey },
      include: {
        client_instance: true,
      },
    });

    if (!license) {
      throw new NotFoundError('License not found');
    }

    // Check if license is active
    if (license.status !== 'ACTIVE') {
      throw new ConflictError('License is not active');
    }

    // Check if license has expired
    if (license.expires_at && license.expires_at < new Date()) {
      throw new ConflictError('License has expired');
    }

    // Check activation count
    if (license.activation_count >= license.max_activations) {
      throw new ConflictError('Maximum activations reached');
    }

    // Verify device fingerprint (if provided)
    if (params.deviceFingerprint && license.client_instance.device_fingerprint !== params.deviceFingerprint) {
      throw new ConflictError('Device fingerprint mismatch');
    }

    // Update license activation
    const updatedLicense = await prisma.enhancedLicenseKey.update({
      where: { id: license.id },
      data: {
        activation_count: license.activation_count + 1,
        last_activated_at: new Date(),
        device_fingerprint: params.deviceFingerprint,
        hardware_signature: params.hardwareSignature,
      },
    });

    // Update client status
    await prisma.clientInstance.update({
      where: { id: license.client_instance_id },
      data: {
        status: 'ACTIVE',
        last_seen_at: new Date(),
        last_sync_at: new Date(),
      },
    });

    logger.info({
      licenseId: license.id,
      clientId: license.client_instance_id,
      activationCount: updatedLicense.activation_count,
    }, 'License activated successfully');

    return {
      license: updatedLicense,
      client: license.client_instance,
      activationStatus: 'SUCCESS',
    };
  }

  /**
   * Get license status for a client
   */
  static async getLicenseStatus(
    clientInstanceId: string,
    actorRole: UserRole
  ): Promise<any> {
    // Enforce RBAC: Can actor view client data?
    RBACService.enforceCanViewClientData(actorRole);

    const client = await prisma.clientInstance.findUnique({
      where: { id: clientInstanceId },
      include: {
        license_key: true,
        usage_stats: {
          orderBy: { recorded_at: 'desc' },
          take: 10,
        },
      },
    });

    if (!client) {
      throw new NotFoundError('Client instance');
    }

    const license = client.license_key;
    if (!license) {
      return {
        client,
        license: null,
        status: 'NO_LICENSE',
        message: 'No license found for this client',
      };
    }

    // Calculate license status
    const now = new Date();
    const isExpired = license.expires_at ? license.expires_at < now : false;
    const isActive = license.status === 'ACTIVE' && !isExpired;
    const creditsRemaining = license.current_credits;
    const creditsUsed = license.max_credits - license.current_credits;

    return {
      client,
      license,
      status: isActive ? 'ACTIVE' : isExpired ? 'EXPIRED' : 'INACTIVE',
      creditsRemaining,
      creditsUsed,
      creditsPercentage: (creditsUsed / license.max_credits) * 100,
      isExpired,
      expiresAt: license.expires_at,
      activationCount: license.activation_count,
      maxActivations: license.max_activations,
      canActivate: license.activation_count < license.max_activations,
    };
  }

  /**
   * Get billing summary for a client
   */
  static async getBillingSummary(
    clientInstanceId: string,
    actorRole: UserRole
  ): Promise<any> {
    // Enforce RBAC: Can actor view client data?
    RBACService.enforceCanViewClientData(actorRole);

    const client = await prisma.clientInstance.findUnique({
      where: { id: clientInstanceId },
      include: {
        license_key: true,
      },
    });

    if (!client) {
      throw new NotFoundError('Client instance');
    }

    // Get credit purchases
    const purchases = await prisma.creditPurchase.findMany({
      where: { client_instance_id: clientInstanceId },
      orderBy: { created_at: 'desc' },
    });

    // Calculate totals
    const totalCreditsPurchased = purchases.reduce((sum, p) => sum + p.credits_purchased, 0);
    const totalAmountSpent = purchases.reduce((sum, p) => sum + p.total_cost, 0);
    const lastPurchase = purchases[0];

    return {
      client,
      totalCreditsPurchased,
      totalAmountSpent,
      lastPurchase,
      purchaseHistory: purchases,
      currentCredits: client.license_key?.current_credits || 0,
      maxCredits: client.license_key?.max_credits || 0,
    };
  }

  /**
   * Get all licenses for master admin
   */
  static async getAllLicenses(actorRole: UserRole): Promise<any> {
    // Enforce RBAC: Can actor manage clients?
    RBACService.enforceCanManageClients(actorRole);

    const licenses = await prisma.enhancedLicenseKey.findMany({
      include: {
        client_instance: {
          select: {
            id: true,
            client_name: true,
            client_code: true,
            contact_email: true,
            status: true,
            last_seen_at: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Calculate statistics
    const totalLicenses = licenses.length;
    const activeLicenses = licenses.filter(l => l.status === 'ACTIVE').length;
    const expiredLicenses = licenses.filter(l => l.expires_at && l.expires_at < new Date()).length;
    const totalCreditsIssued = licenses.reduce((sum, l) => sum + l.max_credits, 0);
    const totalCreditsUsed = licenses.reduce((sum, l) => sum + (l.max_credits - l.current_credits), 0);

    return {
      licenses,
      statistics: {
        totalLicenses,
        activeLicenses,
        expiredLicenses,
        totalCreditsIssued,
        totalCreditsUsed,
        creditsUtilizationPercentage: totalCreditsIssued > 0 ? (totalCreditsUsed / totalCreditsIssued) * 100 : 0,
      },
    };
  }

  /**
   * Generate a unique license key
   */
  private static generateLicenseKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get credit pricing based on pack type
   */
  private static getCreditPricing(packType: string): { pricePerCredit: number; packName: string } {
    const pricing = {
      'STARTER': { pricePerCredit: 0.10, packName: 'Starter Pack' },
      'BUSINESS': { pricePerCredit: 0.08, packName: 'Business Pack' },
      'ENTERPRISE': { pricePerCredit: 0.05, packName: 'Enterprise Pack' },
      'CUSTOM': { pricePerCredit: 0.12, packName: 'Custom Pack' },
    };

    return pricing[packType as keyof typeof pricing] || pricing['CUSTOM'];
  }

  /**
   * Revoke a license
   */
  static async revokeLicense(
    licenseId: string,
    reason: string,
    actorRole: UserRole,
    actorId: string
  ): Promise<any> {
    // Enforce RBAC: Can actor manage clients?
    RBACService.enforceCanManageClients(actorRole);

    const license = await prisma.enhancedLicenseKey.findUnique({
      where: { id: licenseId },
      include: {
        client_instance: true,
      },
    });

    if (!license) {
      throw new NotFoundError('License not found');
    }

    // Update license status
    const updatedLicense = await prisma.enhancedLicenseKey.update({
      where: { id: licenseId },
      data: {
        status: 'REVOKED',
        revoked_at: new Date(),
        revoked_reason: reason,
        revoked_by_id: actorId,
      },
    });

    // Update client status
    await prisma.clientInstance.update({
      where: { id: license.client_instance_id },
      data: { status: 'SUSPENDED' },
    });

    // Create notification
    await prisma.clientNotification.create({
      data: {
        client_instance_id: license.client_instance_id,
        notification_type: 'LICENSE_REVOKED',
        title: 'License Revoked',
        message: `Your license has been revoked. Reason: ${reason}`,
      },
    });

    logger.info({
      licenseId,
      clientId: license.client_instance_id,
      reason,
      actorId,
    }, 'License revoked successfully');

    return updatedLicense;
  }
}
