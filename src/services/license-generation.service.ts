import { PrismaClient, LicenseType, LicenseStatus, ActivationMethod } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// RSA Key Pair for JWT signing (generate once and store securely)
const PRIVATE_KEY_PATH = path.join(process.cwd(), 'keys', 'license_private_key.pem');
const PUBLIC_KEY_PATH = path.join(process.cwd(), 'keys', 'license_public_key.pem');

export interface LicenseGenerationRequest {
  customerEmail: string;
  customerName?: string;
  companyName?: string;
  licenseType: LicenseType;
  deviceFingerprint?: string;
  hardwareSignature?: string;
  maxActivations?: number;
  expiresInDays?: number; // null = perpetual
  purchaseAmount?: number;
  currency?: string;
  paymentId?: string;
  features?: any;
  creditLimit?: number;
  createdById?: string;
}

export interface LicenseJWTPayload {
  licenseKey: string;
  deviceFingerprint?: string;
  hardwareSignature?: string;
  licenseType: LicenseType;
  features?: any;
  creditLimit?: number;
  issuedAt: number;
  expiresAt?: number; // undefined = perpetual
}

/**
 * License Generation Service
 * Handles creation and management of software licenses
 */
export class LicenseGenerationService {
  /**
   * Generate a new license key
   */
  static async generateLicense(request: LicenseGenerationRequest) {
    // Generate unique license key
    const licenseKey = this.generateLicenseKey();

    // Calculate expiry date
    let expiresAt: Date | null = null;
    if (request.expiresInDays !== undefined && request.expiresInDays !== null) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + request.expiresInDays);
    }

    // Create license in database
    const license = await prisma.enhancedLicenseKey.create({
      data: {
        license_key: licenseKey,
        license_type: request.licenseType,
        status: LicenseStatus.PENDING,
        device_fingerprint: request.deviceFingerprint,
        hardware_signature: request.hardwareSignature,
        max_activations: request.maxActivations || 1,
        activation_count: 0,
        customer_email: request.customerEmail,
        customer_name: request.customerName,
        company_name: request.companyName,
        purchase_amount: request.purchaseAmount,
        currency: request.currency || 'USD',
        payment_id: request.paymentId,
        expires_at: expiresAt,
        features_json: request.features ? JSON.parse(JSON.stringify(request.features)) : undefined,
        credit_limit: request.creditLimit,
        created_by_id: request.createdById,
      },
    });

    // Generate JWT token for offline validation
    const jwtToken = await this.generateJWTToken(license);

    // Update license with JWT
    await prisma.enhancedLicenseKey.update({
      where: { id: license.id },
      data: {
        jwt_token: jwtToken,
        public_key: this.getPublicKey(),
      },
    });

    return {
      ...license,
      jwt_token: jwtToken,
      public_key: this.getPublicKey(),
    };
  }

  /**
   * Generate license key (32-character alphanumeric)
   */
  private static generateLicenseKey(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar characters
    const segments = 4;
    const segmentLength = 8;

    const segments_arr = [];
    for (let i = 0; i < segments; i++) {
      let segment = '';
      for (let j = 0; j < segmentLength; j++) {
        segment += chars[Math.floor(Math.random() * chars.length)];
      }
      segments_arr.push(segment);
    }

    return segments_arr.join('-');
  }

  /**
   * Generate JWT token for license
   */
  private static async generateJWTToken(license: any): Promise<string> {
    const privateKey = this.getPrivateKey();

    const payload: LicenseJWTPayload = {
      licenseKey: license.license_key,
      deviceFingerprint: license.device_fingerprint,
      hardwareSignature: license.hardware_signature,
      licenseType: license.license_type,
      features: license.features_json,
      creditLimit: license.credit_limit,
      issuedAt: Date.now(),
      expiresAt: license.expires_at ? new Date(license.expires_at).getTime() : undefined,
    };

    return jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      expiresIn: license.expires_at ? undefined : '100y', // 100 years for perpetual
    });
  }

  /**
   * Verify JWT license token
   */
  static async verifyLicenseToken(token: string, deviceFingerprint: string): Promise<{
    valid: boolean;
    payload?: LicenseJWTPayload;
    reason?: string;
  }> {
    try {
      const publicKey = this.getPublicKey();
      const payload = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
      }) as LicenseJWTPayload;

      // Check device binding
      if (payload.deviceFingerprint && payload.deviceFingerprint !== deviceFingerprint) {
        return {
          valid: false,
          reason: 'License is bound to a different device',
        };
      }

      // Check expiry
      if (payload.expiresAt && payload.expiresAt < Date.now()) {
        return {
          valid: false,
          reason: 'License has expired',
        };
      }

      return {
        valid: true,
        payload,
      };
    } catch (error: any) {
      return {
        valid: false,
        reason: `Invalid license token: ${error.message}`,
      };
    }
  }

  /**
   * Activate license
   */
  static async activateLicense(
    licenseKey: string,
    deviceFingerprint: string,
    hardwareSignature: string,
    activationMethod: ActivationMethod,
    ipAddress?: string,
    userAgent?: string,
    countryCode?: string
  ): Promise<{ success: boolean; message: string; license?: any }> {
    const license = await prisma.enhancedLicenseKey.findUnique({
      where: { license_key: licenseKey },
    });

    if (!license) {
      return { success: false, message: 'Invalid license key' };
    }

    // Check if revoked
    if (license.is_revoked) {
      return { success: false, message: `License has been revoked: ${license.revocation_reason}` };
    }

    // Check if expired
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return { success: false, message: 'License has expired' };
    }

    // Check activation count
    if (license.activation_count >= license.max_activations) {
      // Check if this device is already activated
      const existingActivation = await prisma.licenseActivation.findFirst({
        where: {
          license_key_id: license.id,
          device_fingerprint: deviceFingerprint,
          success: true,
        },
      });

      if (!existingActivation) {
        return {
          success: false,
          message: `License has reached maximum activation count (${license.max_activations})`,
        };
      }

      // Re-activation of same device - allow
    }

    // Check device binding (if license is already bound)
    if (license.device_fingerprint && license.device_fingerprint !== deviceFingerprint) {
      // Log suspicious activity
      await prisma.suspiciousActivity.create({
        data: {
          device_fingerprint: deviceFingerprint,
          hardware_signature: hardwareSignature,
          activity_type: 'LICENSE_SHARE',
          severity: 'HIGH',
          description: `Attempted to activate license ${licenseKey} bound to different device`,
          ip_address: ipAddress,
          action_taken: 'BLOCKED',
        },
      });

      return {
        success: false,
        message: 'License is bound to a different device',
      };
    }

    // Activate license
    const isFirstActivation = !license.activated_at;

    const updatedLicense = await prisma.enhancedLicenseKey.update({
      where: { id: license.id },
      data: {
        status: LicenseStatus.ACTIVE,
        device_fingerprint: deviceFingerprint,
        hardware_signature: hardwareSignature,
        activation_method: activationMethod,
        activation_ip: ipAddress,
        activation_count: isFirstActivation ? { increment: 1 } : undefined,
        activated_at: isFirstActivation ? new Date() : undefined,
      },
    });

    // Log activation
    await prisma.licenseActivation.create({
      data: {
        license_key_id: license.id,
        device_fingerprint: deviceFingerprint,
        hardware_signature: hardwareSignature,
        activation_method: activationMethod,
        success: true,
        ip_address: ipAddress,
        user_agent: userAgent,
        country_code: countryCode,
      },
    });

    // If this was a trial, mark it as activated
    await prisma.trialRegistry.updateMany({
      where: {
        OR: [
          { device_fingerprint: deviceFingerprint },
          { hardware_signature: hardwareSignature },
        ],
      },
      data: {
        status: 'ACTIVATED',
        activated_at: new Date(),
        license_key_id: license.id,
      },
    });

    return {
      success: true,
      message: 'License activated successfully',
      license: updatedLicense,
    };
  }

  /**
   * Revoke license
   */
  static async revokeLicense(licenseKey: string, reason: string): Promise<void> {
    await prisma.enhancedLicenseKey.update({
      where: { license_key: licenseKey },
      data: {
        is_revoked: true,
        revoked_at: new Date(),
        revocation_reason: reason,
        status: LicenseStatus.REVOKED,
      },
    });
  }

  /**
   * Get license details
   */
  static async getLicenseDetails(licenseKey: string) {
    return await prisma.enhancedLicenseKey.findUnique({
      where: { license_key: licenseKey },
      include: {
        activation_history: {
          orderBy: { attempted_at: 'desc' },
          take: 10,
        },
        trial_registry: true,
      },
    });
  }

  /**
   * Get private key for JWT signing
   */
  private static getPrivateKey(): string {
    if (!fs.existsSync(PRIVATE_KEY_PATH)) {
      throw new Error('Private key not found. Run key generation first.');
    }
    return fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  }

  /**
   * Get public key for JWT verification
   */
  private static getPublicKey(): string {
    if (!fs.existsSync(PUBLIC_KEY_PATH)) {
      throw new Error('Public key not found. Run key generation first.');
    }
    return fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
  }

  /**
   * Generate RSA key pair (run once during setup)
   */
  static async generateKeyPair(): Promise<void> {
    const keysDir = path.join(process.cwd(), 'keys');
    if (!fs.existsSync(keysDir)) {
      fs.mkdirSync(keysDir, { recursive: true });
    }

    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });
    fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, { mode: 0o644 });

    console.log('✅ RSA key pair generated successfully');
    console.log(`Private key: ${PRIVATE_KEY_PATH}`);
    console.log(`Public key: ${PUBLIC_KEY_PATH}`);
  }
}

