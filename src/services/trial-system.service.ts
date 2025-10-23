import { PrismaClient } from '@prisma/client';
import { DatabaseIsolationService } from './database-isolation.service';
import logger from '../utils/logger';

interface TrialSession {
  id: string;
  clientId: string;
  deviceFingerprint: string;
  creditsRemaining: number;
  creditsConsumed: number;
  accessCount: number;
  firstAccessAt: Date;
  lastAccessAt: Date;
  isActive: boolean;
  licenseKey?: string;
  activatedAt?: Date;
}

interface CreditTransaction {
  id: string;
  trialSessionId: string;
  operationType: string;
  creditsConsumed: number;
  remainingCredits: number;
  createdAt: Date;
}

export class TrialSystemService {
  private static readonly INITIAL_CREDITS = 50;
  private static readonly CREDIT_COSTS = {
    'PRODUCT_VIEW': 0,           // Free
    'PRODUCT_SEARCH': 0,         // Free
    'SALE_CREATE': 1,           // 1 credit
    'PRODUCT_CREATE': 2,        // 2 credits
    'PRODUCT_UPDATE': 1,        // 1 credit
    'PRODUCT_DELETE': 1,        // 1 credit
    'INVENTORY_ADJUST': 2,      // 2 credits
    'REPORT_GENERATE': 3,       // 3 credits
    'USER_CREATE': 5,           // 5 credits
    'BACKUP_CREATE': 5,         // 5 credits
    'SYSTEM_SETTINGS': 10,      // 10 credits
  };

  /**
   * Initialize trial session for a client
   */
  static async initializeTrialSession(
    clientId: string, 
    deviceFingerprint: string
  ): Promise<TrialSession> {
    try {
      const clientDb = DatabaseIsolationService.getClientDatabase(clientId);
      
      // Check if trial session already exists
      const existingSession = await clientDb.$queryRaw`
        SELECT * FROM trial_sessions 
        WHERE client_id = ${clientId} AND device_fingerprint = ${deviceFingerprint}
      ` as TrialSession[];

      if (existingSession.length > 0) {
        // Update access count and last access
        await clientDb.$executeRaw`
          UPDATE trial_sessions 
          SET 
            access_count = access_count + 1,
            last_access_at = CURRENT_TIMESTAMP
          WHERE client_id = ${clientId} AND device_fingerprint = ${deviceFingerprint}
        `;
        
        logger.info(`✅ Trial session updated for client ${clientId}`);
        return existingSession[0];
      }

      // Create new trial session
      const newSession = await clientDb.$queryRaw`
        INSERT INTO trial_sessions (
          client_id, device_fingerprint, credits_remaining, credits_consumed, 
          access_count, first_access_at, last_access_at, is_active
        ) VALUES (
          ${clientId}, ${deviceFingerprint}, ${this.INITIAL_CREDITS}, 0, 
          1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true
        ) RETURNING *
      ` as TrialSession[];

      logger.info(`✅ New trial session created for client ${clientId} with ${this.INITIAL_CREDITS} credits`);
      return newSession[0];

    } catch (error) {
      logger.error(`❌ Failed to initialize trial session for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Check if client has enough credits for an operation
   */
  static async checkCredits(
    clientId: string, 
    deviceFingerprint: string, 
    operationType: string
  ): Promise<{ hasCredits: boolean; creditsRemaining: number; creditsNeeded: number }> {
    try {
      const clientDb = DatabaseIsolationService.getClientDatabase(clientId);
      
      const session = await clientDb.$queryRaw`
        SELECT * FROM trial_sessions 
        WHERE client_id = ${clientId} AND device_fingerprint = ${deviceFingerprint} AND is_active = true
      ` as TrialSession[];

      if (session.length === 0) {
        throw new Error('Trial session not found');
      }

      const creditsNeeded = this.CREDIT_COSTS[operationType as keyof typeof this.CREDIT_COSTS] || 1;
      const hasCredits = session[0].creditsRemaining >= creditsNeeded;

      return {
        hasCredits,
        creditsRemaining: session[0].creditsRemaining,
        creditsNeeded
      };

    } catch (error) {
      logger.error(`❌ Failed to check credits for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Consume credits for an operation
   */
  static async consumeCredits(
    clientId: string, 
    deviceFingerprint: string, 
    operationType: string
  ): Promise<{ success: boolean; creditsRemaining: number; isLocked: boolean }> {
    try {
      const clientDb = DatabaseIsolationService.getClientDatabase(clientId);
      
      const creditsNeeded = this.CREDIT_COSTS[operationType as keyof typeof this.CREDIT_COSTS] || 1;
      
      // Start transaction
      const result = await clientDb.$transaction(async (tx) => {
        // Get current session
        const session = await tx.$queryRaw`
          SELECT * FROM trial_sessions 
          WHERE client_id = ${clientId} AND device_fingerprint = ${deviceFingerprint} AND is_active = true
        ` as TrialSession[];

        if (session.length === 0) {
          throw new Error('Trial session not found');
        }

        const currentSession = session[0];

        // Check if enough credits
        if (currentSession.creditsRemaining < creditsNeeded) {
          return {
            success: false,
            creditsRemaining: currentSession.creditsRemaining,
            isLocked: true
          };
        }

        // Consume credits
        const newCreditsRemaining = currentSession.creditsRemaining - creditsNeeded;
        const newCreditsConsumed = currentSession.creditsConsumed + creditsNeeded;

        // Update trial session
        await tx.$executeRaw`
          UPDATE trial_sessions 
          SET 
            credits_remaining = ${newCreditsRemaining},
            credits_consumed = ${newCreditsConsumed},
            last_access_at = CURRENT_TIMESTAMP
          WHERE client_id = ${clientId} AND device_fingerprint = ${deviceFingerprint}
        `;

        // Record credit transaction
        await tx.$executeRaw`
          INSERT INTO credit_transactions (
            trial_session_id, operation_type, credits_consumed, remaining_credits
          ) VALUES (
            ${currentSession.id}, ${operationType}, ${creditsNeeded}, ${newCreditsRemaining}
          )
        `;

        return {
          success: true,
          creditsRemaining: newCreditsRemaining,
          isLocked: newCreditsRemaining === 0
        };
      });

      if (result.success) {
        logger.info(`✅ Credits consumed for client ${clientId}: ${creditsNeeded} credits, ${result.creditsRemaining} remaining`);
      } else {
        logger.warn(`⚠️ Insufficient credits for client ${clientId}: ${creditsNeeded} needed, ${result.creditsRemaining} available`);
      }

      return result;

    } catch (error) {
      logger.error(`❌ Failed to consume credits for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Get trial session status
   */
  static async getTrialStatus(
    clientId: string, 
    deviceFingerprint: string
  ): Promise<TrialSession | null> {
    try {
      const clientDb = DatabaseIsolationService.getClientDatabase(clientId);
      
      const session = await clientDb.$queryRaw`
        SELECT * FROM trial_sessions 
        WHERE client_id = ${clientId} AND device_fingerprint = ${deviceFingerprint}
      ` as TrialSession[];

      return session.length > 0 ? session[0] : null;

    } catch (error) {
      logger.error(`❌ Failed to get trial status for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Get credit transaction history
   */
  static async getCreditHistory(
    clientId: string, 
    deviceFingerprint: string,
    limit: number = 50
  ): Promise<CreditTransaction[]> {
    try {
      const clientDb = DatabaseIsolationService.getClientDatabase(clientId);
      
      const session = await this.getTrialStatus(clientId, deviceFingerprint);
      if (!session) {
        return [];
      }

      const transactions = await clientDb.$queryRaw`
        SELECT * FROM credit_transactions 
        WHERE trial_session_id = ${session.id}
        ORDER BY created_at DESC
        LIMIT ${limit}
      ` as CreditTransaction[];

      return transactions;

    } catch (error) {
      logger.error(`❌ Failed to get credit history for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Activate license for trial session
   */
  static async activateLicense(
    clientId: string, 
    deviceFingerprint: string, 
    licenseKey: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const clientDb = DatabaseIsolationService.getClientDatabase(clientId);
      
      // Verify license key (this would typically check with master admin system)
      const isValidLicense = await this.verifyLicenseKey(licenseKey, deviceFingerprint);
      
      if (!isValidLicense) {
        return {
          success: false,
          message: 'Invalid or expired license key'
        };
      }

      // Activate license
      await clientDb.$executeRaw`
        UPDATE trial_sessions 
        SET 
          license_key = ${licenseKey},
          activated_at = CURRENT_TIMESTAMP,
          is_active = true
        WHERE client_id = ${clientId} AND device_fingerprint = ${deviceFingerprint}
      `;

      logger.info(`✅ License activated for client ${clientId} with key ${licenseKey}`);
      
      return {
        success: true,
        message: 'License activated successfully'
      };

    } catch (error) {
      logger.error(`❌ Failed to activate license for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Verify license key
   */
  private static async verifyLicenseKey(licenseKey: string, deviceFingerprint: string): Promise<boolean> {
    try {
      // This would typically check with the master admin system
      // For now, we'll implement a simple verification
      
      // Check if license key format is valid (32 characters, alphanumeric)
      if (!/^[A-Z0-9]{32}$/.test(licenseKey)) {
        return false;
      }

      // Check if license key exists in master database and is not used
      // This would be implemented with the master admin system
      
      return true; // For MVP, assume valid
      
    } catch (error) {
      logger.error(`❌ Failed to verify license key:`, error);
      return false;
    }
  }

  /**
   * Reset trial session (for testing)
   */
  static async resetTrialSession(
    clientId: string, 
    deviceFingerprint: string
  ): Promise<void> {
    try {
      const clientDb = DatabaseIsolationService.getClientDatabase(clientId);
      
      await clientDb.$executeRaw`
        UPDATE trial_sessions 
        SET 
          credits_remaining = ${this.INITIAL_CREDITS},
          credits_consumed = 0,
          license_key = NULL,
          activated_at = NULL,
          is_active = true
        WHERE client_id = ${clientId} AND device_fingerprint = ${deviceFingerprint}
      `;

      logger.info(`✅ Trial session reset for client ${clientId}`);
      
    } catch (error) {
      logger.error(`❌ Failed to reset trial session for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Get trial system statistics
   */
  static async getTrialStatistics(): Promise<{
    totalTrialSessions: number;
    activeTrialSessions: number;
    totalCreditsConsumed: number;
    averageCreditsPerSession: number;
  }> {
    try {
      // This would aggregate data from all client databases
      // For MVP, we'll return mock data
      
      return {
        totalTrialSessions: 0,
        activeTrialSessions: 0,
        totalCreditsConsumed: 0,
        averageCreditsPerSession: 0
      };
      
    } catch (error) {
      logger.error(`❌ Failed to get trial statistics:`, error);
      throw error;
    }
  }
}
