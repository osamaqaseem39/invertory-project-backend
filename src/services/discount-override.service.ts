import { PrismaClient, UserRole } from '@prisma/client';
import { AuthorizationError, ValidationError, NotFoundError } from '../utils/errors';
import { AuditService } from './audit.service';
import { verifyPassword } from '../utils/password';

const prisma = new PrismaClient();

// ===== INTERFACES =====

interface DiscountCaps {
  max_line_discount: number;
  max_cart_discount: number;
  can_override: boolean;
}

interface ValidateDiscountParams {
  user_id: string;
  discount_percentage: number;
  discount_type: 'line' | 'cart';
}

interface RequestOverrideParams {
  session_id: string;
  override_type: string;
  reason_code: string;
  reason_detail?: string;
  metadata?: any;
}

interface ApproveOverrideParams {
  override_id: string;
  approver_username: string;
  approver_pin: string;
}

// ===== CONSTANTS =====

const DEFAULT_DISCOUNT_CAPS: Record<UserRole, DiscountCaps> = {
  owner_ultimate_super_admin: {
    max_line_discount: 100,
    max_cart_discount: 100,
    can_override: true,
  },
  admin: {
    max_line_discount: 50,
    max_cart_discount: 30,
    can_override: true,
  },
  cashier: {
    max_line_discount: 10,
    max_cart_discount: 5,
    can_override: false,
  },
  inventory_manager: {
    max_line_discount: 0,
    max_cart_discount: 0,
    can_override: false,
  },
  guest: {
    max_line_discount: 0,
    max_cart_discount: 0,
    can_override: false,
  },
};

// ===== SERVICE =====

export class DiscountOverrideService {
  /**
   * Get discount caps for a user role
   */
  static async getDiscountCaps(userId: string): Promise<DiscountCaps> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        max_line_discount: true,
        max_cart_discount: true,
        can_approve_overrides: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Use user-specific caps if set, otherwise use defaults
    return {
      max_line_discount: user.max_line_discount 
        ? Number(user.max_line_discount) 
        : DEFAULT_DISCOUNT_CAPS[user.role].max_line_discount,
      max_cart_discount: user.max_cart_discount 
        ? Number(user.max_cart_discount) 
        : DEFAULT_DISCOUNT_CAPS[user.role].max_cart_discount,
      can_override: user.can_approve_overrides || DEFAULT_DISCOUNT_CAPS[user.role].can_override,
    };
  }

  /**
   * Validate if a discount is allowed for a user
   */
  static async validateDiscount(params: ValidateDiscountParams): Promise<{
    allowed: boolean;
    requires_override: boolean;
    max_allowed: number;
  }> {
    const caps = await this.getDiscountCaps(params.user_id);
    const maxAllowed = params.discount_type === 'line' 
      ? caps.max_line_discount 
      : caps.max_cart_discount;

    if (params.discount_percentage <= maxAllowed) {
      return {
        allowed: true,
        requires_override: false,
        max_allowed: maxAllowed,
      };
    }

    // Discount exceeds cap
    return {
      allowed: false,
      requires_override: true,
      max_allowed: maxAllowed,
    };
  }

  /**
   * Request a manager override
   */
  static async requestOverride(params: RequestOverrideParams, context: { actorId: string; actorRole: UserRole }) {
    // Validate session exists
    const session = await prisma.pOSSession.findUnique({
      where: { id: params.session_id },
    });

    if (!session) {
      throw new NotFoundError('POS session not found');
    }

    if (session.status !== 'ACTIVE') {
      throw new ValidationError('POS session is not active');
    }

    // Create override request (pending approval)
    const overrideRequest = {
      session_id: params.session_id,
      requesting_user_id: context.actorId,
      override_type: params.override_type,
      reason_code: params.reason_code,
      reason_detail: params.reason_detail,
      metadata: params.metadata,
    };

    // For now, return the request data
    // In real implementation, this would be stored and await approval
    return overrideRequest;
  }

  /**
   * Approve a manager override with PIN
   */
  static async approveOverride(
    params: ApproveOverrideParams,
    requestData: RequestOverrideParams
  ) {
    // Find approver by username
    const approver = await prisma.user.findUnique({
      where: { username: params.approver_username },
      select: {
        id: true,
        username: true,
        display_name: true,
        role: true,
        password_hash: true,
        can_approve_overrides: true,
      },
    });

    if (!approver) {
      throw new NotFoundError('Approver not found');
    }

    // Verify approver has override permissions
    if (!approver.can_approve_overrides && 
        !['admin', 'owner_ultimate_super_admin'].includes(approver.role)) {
      throw new AuthorizationError('Approver does not have override permissions');
    }

    // Verify PIN (password)
    const pinValid = await verifyPassword(params.approver_pin, approver.password_hash);
    if (!pinValid) {
      throw new AuthorizationError('Invalid PIN');
    }

    // Create override record
    const override = await prisma.managerOverride.create({
      data: {
        session_id: requestData.session_id,
        requesting_user_id: approver.id,
        override_type: requestData.override_type,
        reason_code: requestData.reason_code,
        reason_detail: requestData.reason_detail,
        approver_id: approver.id,
        metadata: requestData.metadata,
      },
      include: {
        requesting_user: {
          select: {
            display_name: true,
            role: true,
          },
        },
        approver: {
          select: {
            display_name: true,
            role: true,
          },
        },
      },
    });

    // Create audit log
    await AuditService.createLog({
      actorUserId: approver.id,
      action: 'MANAGER_OVERRIDE',
      metadata: {
        override_id: override.id,
        override_type: requestData.override_type,
        reason_code: requestData.reason_code,
        requesting_user: override.requesting_user.display_name,
      },
    });

    return override;
  }

  /**
   * Get override history for a session
   */
  static async getOverrides(sessionId: string, actorRole: UserRole) {
    if (!['cashier', 'admin', 'owner_ultimate_super_admin'].includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const overrides = await prisma.managerOverride.findMany({
      where: { session_id: sessionId },
      include: {
        requesting_user: {
          select: {
            display_name: true,
            role: true,
          },
        },
        approver: {
          select: {
            display_name: true,
            role: true,
          },
        },
      },
      orderBy: { approved_at: 'desc' },
    });

    return overrides;
  }
}

export default DiscountOverrideService;

