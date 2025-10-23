import { PrismaClient, TrialStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface TrialCheckRequest {
  deviceFingerprint: string;
  hardwareSignature: string;
  ipAddress?: string;
  userAgent?: string;
  countryCode?: string;
  timezone?: string;
}

export interface TrialCheckResponse {
  eligible: boolean;
  reason?: string;
  message: string;
  trialGuestId?: string;
  creditsRemaining?: number;
  status?: TrialStatus;
  requiresActivation?: boolean;
  isVMDetected?: boolean;
  isSuspicious?: boolean;
}

/**
 * Trial Validation Service
 * Server-side trial tracking and validation
 */
export class TrialValidationService {
  /**
   * Check if device is eligible for trial
   */
  static async checkTrialEligibility(request: TrialCheckRequest): Promise<TrialCheckResponse> {
    // Check if device fingerprint already exists in trial registry
    const existing = await prisma.trialRegistry.findFirst({
      where: {
        OR: [
          { device_fingerprint: request.deviceFingerprint },
          { hardware_signature: request.hardwareSignature },
        ],
      },
    });

    if (existing) {
      // Update last seen
      await prisma.trialRegistry.update({
        where: { id: existing.id },
        data: {
          last_seen_at: new Date(),
          ip_address: request.ipAddress,
          user_agent: request.userAgent,
        },
      });

      // Check status
      switch (existing.status) {
        case TrialStatus.ACTIVATED:
          return {
            eligible: false,
            reason: 'already_activated',
            message: 'This device has already been activated with a license.',
            status: existing.status,
            requiresActivation: false,
          };

        case TrialStatus.EXHAUSTED:
          return {
            eligible: false,
            reason: 'trial_exhausted',
            message: `Trial has been exhausted (${existing.credits_used}/${existing.credits_allocated} credits used). Please purchase a license to continue.`,
            status: existing.status,
            requiresActivation: true,
            creditsRemaining: 0,
          };

        case TrialStatus.REVOKED:
          return {
            eligible: false,
            reason: 'trial_revoked',
            message: 'Trial has been revoked due to suspicious activity.',
            status: existing.status,
            requiresActivation: true,
          };

        case TrialStatus.EXPIRED:
          return {
            eligible: false,
            reason: 'trial_expired',
            message: 'Trial has expired. Please purchase a license.',
            status: existing.status,
            requiresActivation: true,
          };

        case TrialStatus.ACTIVE:
          // Trial still active
          return {
            eligible: true,
            message: 'Trial session resumed.',
            trialGuestId: existing.trial_guest_id,
            creditsRemaining: existing.credits_remaining,
            status: existing.status,
            requiresActivation: false,
            isVMDetected: existing.is_vm_detected,
            isSuspicious: existing.is_suspicious,
          };
      }
    }

    // New device - create trial
    const trialGuestId = this.generateTrialGuestId();

    const trial = await prisma.trialRegistry.create({
      data: {
        device_fingerprint: request.deviceFingerprint,
        hardware_signature: request.hardwareSignature,
        trial_guest_id: trialGuestId,
        status: TrialStatus.ACTIVE,
        credits_allocated: 50,
        credits_used: 0,
        credits_remaining: 50,
        ip_address: request.ipAddress,
        user_agent: request.userAgent,
        country_code: request.countryCode,
        timezone: request.timezone,
      },
    });

    return {
      eligible: true,
      message: 'Trial started successfully. You have 50 free invoices.',
      trialGuestId: trial.trial_guest_id,
      creditsRemaining: 50,
      status: trial.status,
      requiresActivation: false,
    };
  }

  /**
   * Consume trial credit (e.g., when creating invoice)
   */
  static async consumeCredit(
    deviceFingerprint: string,
    action: string,
    referenceId?: string,
    metadata?: any
  ): Promise<{ success: boolean; creditsRemaining: number; message: string }> {
    const trial = await prisma.trialRegistry.findFirst({
      where: {
        OR: [
          { device_fingerprint: deviceFingerprint },
          { hardware_signature: deviceFingerprint }, // Allow both
        ],
      },
    });

    if (!trial) {
      return {
        success: false,
        creditsRemaining: 0,
        message: 'Trial session not found. Please start a trial first.',
      };
    }

    // Check if trial is active
    if (trial.status !== TrialStatus.ACTIVE) {
      return {
        success: false,
        creditsRemaining: trial.credits_remaining,
        message: `Trial is ${trial.status}. Cannot consume credits.`,
      };
    }

    // Check if credits available
    if (trial.credits_remaining <= 0) {
      // Mark as exhausted
      await prisma.trialRegistry.update({
        where: { id: trial.id },
        data: {
          status: TrialStatus.EXHAUSTED,
          trial_exhausted_at: new Date(),
        },
      });

      return {
        success: false,
        creditsRemaining: 0,
        message: 'Trial credits exhausted. Please activate with a license key.',
      };
    }

    // Consume 1 credit
    const newBalance = trial.credits_remaining - 1;
    const newUsed = trial.credits_used + 1;

    // Generate idempotency key
    const idempotencyKey = `${trial.id}_${action}_${Date.now()}_${Math.random()}`;

    // Update trial
    await prisma.trialRegistry.update({
      where: { id: trial.id },
      data: {
        credits_used: newUsed,
        credits_remaining: newBalance,
        last_seen_at: new Date(),
        // Mark as exhausted if this was the last credit
        status: newBalance === 0 ? TrialStatus.EXHAUSTED : TrialStatus.ACTIVE,
        trial_exhausted_at: newBalance === 0 ? new Date() : undefined,
      },
    });

    // Log to credit ledger
    await prisma.creditLedgerEntry.create({
      data: {
        trial_registry_id: trial.id,
        entry_type: 'CONSUME',
        amount: -1,
        balance_before: trial.credits_remaining,
        balance_after: newBalance,
        action,
        reference_id: referenceId,
        idempotency_key: idempotencyKey,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });

    return {
      success: true,
      creditsRemaining: newBalance,
      message: newBalance === 0
        ? 'Trial credits exhausted. Please activate to continue.'
        : `Credit consumed. ${newBalance} credits remaining.`,
    };
  }

  /**
   * Generate trial guest ID
   */
  private static generateTrialGuestId(): string {
    const random = Math.random().toString(36).substring(2, 18).toUpperCase();
    return `TRIAL_${random}`;
  }

  /**
   * Get trial statistics
   */
  static async getTrialStats(deviceFingerprint: string) {
    const trial = await prisma.trialRegistry.findFirst({
      where: {
        OR: [
          { device_fingerprint: deviceFingerprint },
          { hardware_signature: deviceFingerprint },
        ],
      },
      include: {
        credit_ledger: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });

    return trial;
  }

  /**
   * Activate trial (convert to paid)
   */
  static async activateTrial(
    deviceFingerprint: string,
    licenseKeyId: string
  ): Promise<{ success: boolean; message: string }> {
    const trial = await prisma.trialRegistry.findFirst({
      where: {
        OR: [
          { device_fingerprint: deviceFingerprint },
          { hardware_signature: deviceFingerprint },
        ],
      },
    });

    if (!trial) {
      return { success: false, message: 'Trial not found' };
    }

    await prisma.trialRegistry.update({
      where: { id: trial.id },
      data: {
        status: TrialStatus.ACTIVATED,
        activated_at: new Date(),
        license_key_id: licenseKeyId,
      },
    });

    return { success: true, message: 'Trial successfully upgraded to full license' };
  }

  /**
   * Detect trial reset attempts
   */
  static async detectTrialResetAttempt(
    deviceFingerprint: string,
    hardwareSignature: string
  ): Promise<{ isAttempt: boolean; reason?: string }> {
    // Check if hardware signature matches any existing trial
    const matchingTrial = await prisma.trialRegistry.findFirst({
      where: {
        hardware_signature: hardwareSignature,
        status: { in: [TrialStatus.EXHAUSTED, TrialStatus.EXPIRED, TrialStatus.ACTIVATED] },
      },
    });

    if (matchingTrial && matchingTrial.device_fingerprint !== deviceFingerprint) {
      // Same hardware, different device fingerprint = suspicious
      await this.logSuspiciousActivity(
        deviceFingerprint,
        hardwareSignature,
        'TRIAL_RESET',
        'HIGH',
        `Attempted trial reset: Hardware signature matches existing trial ${matchingTrial.trial_guest_id}, but device fingerprint changed`
      );

      return {
        isAttempt: true,
        reason: 'Hardware matches an existing trial, but device fingerprint is different. Trial reset attempt detected.',
      };
    }

    // Check for multiple trials from same IP within short time
    if (matchingTrial) {
      const recentTrials = await prisma.trialRegistry.count({
        where: {
          ip_address: matchingTrial.ip_address,
          first_seen_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      if (recentTrials > 3) {
        await this.logSuspiciousActivity(
          deviceFingerprint,
          hardwareSignature,
          'MULTIPLE_TRIALS',
          'MEDIUM',
          `Multiple trial attempts from IP ${matchingTrial.ip_address} in 24h`
        );

        return {
          isAttempt: true,
          reason: 'Multiple trial attempts from same IP address detected.',
        };
      }
    }

    return { isAttempt: false };
  }

  /**
   * Log suspicious activity
   */
  private static async logSuspiciousActivity(
    deviceFingerprint: string,
    hardwareSignature: string,
    activityType: string,
    severity: string,
    description: string
  ): Promise<void> {
    await prisma.suspiciousActivity.create({
      data: {
        device_fingerprint: deviceFingerprint,
        hardware_signature: hardwareSignature,
        activity_type: activityType,
        severity: severity,
        description: description,
        action_taken: 'FLAGGED',
      },
    });

    // Also flag the trial as suspicious
    await prisma.trialRegistry.updateMany({
      where: {
        OR: [
          { device_fingerprint: deviceFingerprint },
          { hardware_signature: hardwareSignature },
        ],
      },
      data: {
        is_suspicious: true,
        reinstall_attempts: { increment: 1 },
      },
    });
  }

  /**
   * Get all suspicious activities
   */
  static async getSuspiciousActivities(limit: number = 50) {
    return await prisma.suspiciousActivity.findMany({
      orderBy: { detected_at: 'desc' },
      take: limit,
    });
  }

  /**
   * Revoke trial (for abuse)
   */
  static async revokeTrial(deviceFingerprint: string, reason: string): Promise<void> {
    await prisma.trialRegistry.updateMany({
      where: {
        OR: [
          { device_fingerprint: deviceFingerprint },
          { hardware_signature: deviceFingerprint },
        ],
      },
      data: {
        status: TrialStatus.REVOKED,
      },
    });

    await this.logSuspiciousActivity(
      deviceFingerprint,
      '',
      'TRIAL_REVOKED',
      'CRITICAL',
      `Trial revoked: ${reason}`
    );
  }
}

