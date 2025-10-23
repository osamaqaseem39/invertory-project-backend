import { PrismaClient, UserRole } from '@prisma/client';
import { AuthorizationError, ValidationError, NotFoundError } from '../utils/errors';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

// ===== INTERFACES =====

interface QuickAddCustomerParams {
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
}

interface AddStoreCreditParams {
  customer_id: string;
  amount: number;
  reason: string;
  transaction_id?: string;
}

interface UseStoreCreditParams {
  customer_id: string;
  amount: number;
  transaction_id: string;
}

interface IssueGiftCardParams {
  amount: number;
  customer_id?: string;
  expires_at?: Date;
}

interface RedeemGiftCardParams {
  code: string;
  amount: number;
}

interface ServiceContext {
  actorId: string;
  actorRole: UserRole;
}

// ===== SERVICE =====

export class CustomerCreditService {
  /**
   * Quick add customer (POS flow - minimal fields)
   */
  static async quickAddCustomer(params: QuickAddCustomerParams, context: ServiceContext) {
    // RBAC: Cashier, admin, owner
    if (!['cashier', 'admin', 'owner_ultimate_super_admin'].includes(context.actorRole)) {
      throw new AuthorizationError('Insufficient permissions to add customer');
    }

    // Validate required fields
    if (!params.first_name || !params.last_name) {
      throw new ValidationError('First name and last name are required');
    }

    // Generate customer number
    const count = await prisma.customer.count();
    const customerNumber = `CUST-${String(count + 1).padStart(6, '0')}`;

    const customer = await prisma.customer.create({
      data: {
        customer_number: customerNumber,
        first_name: params.first_name,
        last_name: params.last_name,
        phone: params.phone,
        email: params.email,
        is_active: true,
        created_by_id: context.actorId,
      },
    });

    // Create audit log
    await AuditService.createLog({
      actorUserId: context.actorId,
      action: 'CREATE_CUSTOMER',
      metadata: {
        customer_id: customer.id,
        customer_number: customerNumber,
        name: `${params.first_name} ${params.last_name}`,
      },
    });

    return customer;
  }

  /**
   * Add store credit to customer
   */
  static async addStoreCredit(params: AddStoreCreditParams, context: ServiceContext) {
    // RBAC: Admin, owner only
    if (!['admin', 'owner_ultimate_super_admin'].includes(context.actorRole)) {
      throw new AuthorizationError('Insufficient permissions to add store credit');
    }

    if (params.amount <= 0) {
      throw new ValidationError('Amount must be greater than zero');
    }

    return await prisma.$transaction(async (tx) => {
      // Update customer balance
      const customer = await tx.customer.update({
        where: { id: params.customer_id },
        data: {
          store_credit_balance: {
            increment: params.amount,
          },
        },
      });

      // Create ledger entry
      const ledgerEntry = await tx.storeCreditLedger.create({
        data: {
          customer_id: params.customer_id,
          delta: params.amount,
          balance_after: Number(customer.store_credit_balance),
          reason: params.reason,
          transaction_id: params.transaction_id,
          created_by_id: context.actorId,
        },
      });

      // Create audit log
      await AuditService.createLog({
        actorUserId: context.actorId,
        action: 'ADD_STORE_CREDIT',
        metadata: {
          customer_id: params.customer_id,
          amount: params.amount,
          reason: params.reason,
          new_balance: Number(customer.store_credit_balance),
        },
      });

      return {
        customer,
        ledger_entry: ledgerEntry,
      };
    });
  }

  /**
   * Use store credit in a transaction
   */
  static async useStoreCredit(params: UseStoreCreditParams, context: ServiceContext) {
    if (!['cashier', 'admin', 'owner_ultimate_super_admin'].includes(context.actorRole)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    if (params.amount <= 0) {
      throw new ValidationError('Amount must be greater than zero');
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { id: params.customer_id },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Check sufficient balance
    if (Number(customer.store_credit_balance) < params.amount) {
      throw new ValidationError('Insufficient store credit balance');
    }

    return await prisma.$transaction(async (tx) => {
      // Deduct from balance
      const updatedCustomer = await tx.customer.update({
        where: { id: params.customer_id },
        data: {
          store_credit_balance: {
            decrement: params.amount,
          },
        },
      });

      // Create ledger entry
      const ledgerEntry = await tx.storeCreditLedger.create({
        data: {
          customer_id: params.customer_id,
          delta: -params.amount,
          balance_after: Number(updatedCustomer.store_credit_balance),
          reason: 'Used in transaction',
          transaction_id: params.transaction_id,
          created_by_id: context.actorId,
        },
      });

      // Create audit log
      await AuditService.createLog({
        actorUserId: context.actorId,
        action: 'USE_STORE_CREDIT',
        metadata: {
          customer_id: params.customer_id,
          amount: params.amount,
          transaction_id: params.transaction_id,
          new_balance: Number(updatedCustomer.store_credit_balance),
        },
      });

      return {
        customer: updatedCustomer,
        ledger_entry: ledgerEntry,
      };
    });
  }

  /**
   * Get store credit balance
   */
  static async getStoreCreditBalance(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { store_credit_balance: true },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return Number(customer.store_credit_balance);
  }

  /**
   * Get store credit history
   */
  static async getStoreCreditHistory(customerId: string) {
    const history = await prisma.storeCreditLedger.findMany({
      where: { customer_id: customerId },
      include: {
        created_by: {
          select: {
            display_name: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    return history;
  }

  /**
   * Issue a gift card
   */
  static async issueGiftCard(params: IssueGiftCardParams, context: ServiceContext) {
    // RBAC: Admin, owner only
    if (!['admin', 'owner_ultimate_super_admin'].includes(context.actorRole)) {
      throw new AuthorizationError('Insufficient permissions to issue gift card');
    }

    if (params.amount <= 0) {
      throw new ValidationError('Amount must be greater than zero');
    }

    // Generate unique code
    const code = await this.generateGiftCardCode();

    const giftCard = await prisma.giftCard.create({
      data: {
        code: code,
        initial_balance: params.amount,
        current_balance: params.amount,
        customer_id: params.customer_id,
        expires_at: params.expires_at,
        issued_by_id: context.actorId,
      },
    });

    // Create audit log
    await AuditService.createLog({
      actorUserId: context.actorId,
      action: 'ISSUE_GIFT_CARD',
      metadata: {
        gift_card_code: code,
        amount: params.amount,
        customer_id: params.customer_id,
      },
    });

    return giftCard;
  }

  /**
   * Redeem gift card
   */
  static async redeemGiftCard(params: RedeemGiftCardParams, context: ServiceContext) {
    if (!['cashier', 'admin', 'owner_ultimate_super_admin'].includes(context.actorRole)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const giftCard = await prisma.giftCard.findUnique({
      where: { code: params.code.toUpperCase() },
    });

    if (!giftCard) {
      throw new NotFoundError('Gift card not found');
    }

    if (!giftCard.is_active) {
      throw new ValidationError('Gift card is inactive');
    }

    if (giftCard.expires_at && giftCard.expires_at < new Date()) {
      throw new ValidationError('Gift card has expired');
    }

    if (Number(giftCard.current_balance) < params.amount) {
      throw new ValidationError('Insufficient gift card balance');
    }

    // Deduct from balance
    const updatedCard = await prisma.giftCard.update({
      where: { id: giftCard.id },
      data: {
        current_balance: {
          decrement: params.amount,
        },
        is_used: true,
        last_used_at: new Date(),
      },
    });

    // Create audit log
    await AuditService.createLog({
      actorUserId: context.actorId,
      action: 'REDEEM_GIFT_CARD',
      metadata: {
        gift_card_code: params.code,
        amount: params.amount,
        remaining_balance: Number(updatedCard.current_balance),
      },
    });

    return {
      gift_card: updatedCard,
      redeemed_amount: params.amount,
      remaining_balance: Number(updatedCard.current_balance),
    };
  }

  /**
   * Check gift card balance
   */
  static async checkGiftCardBalance(code: string) {
    const giftCard = await prisma.giftCard.findUnique({
      where: { code: code.toUpperCase() },
      select: {
        code: true,
        current_balance: true,
        is_active: true,
        expires_at: true,
      },
    });

    if (!giftCard) {
      throw new NotFoundError('Gift card not found');
    }

    return {
      balance: Number(giftCard.current_balance),
      is_active: giftCard.is_active,
      is_expired: giftCard.expires_at ? giftCard.expires_at < new Date() : false,
    };
  }

  /**
   * Generate unique gift card code
   */
  private static async generateGiftCardCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code: string;
    let exists = true;

    while (exists) {
      code = '';
      for (let i = 0; i < 16; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // Format: XXXX-XXXX-XXXX-XXXX
      code = code.match(/.{1,4}/g)!.join('-');

      const existing = await prisma.giftCard.findUnique({
        where: { code },
      });

      exists = !!existing;
    }

    return code!;
  }

  /**
   * Add loyalty points to customer
   */
  static async addLoyaltyPoints(customerId: string, points: number, transactionId: string) {
    return await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.update({
        where: { id: customerId },
        data: {
          loyalty_points: {
            increment: points,
          },
        },
      });

      await tx.loyaltyLedger.create({
        data: {
          customer_id: customerId,
          points_delta: points,
          balance_after: customer.loyalty_points,
          reason: 'Points earned from purchase',
          transaction_id: transactionId,
        },
      });

      return customer.loyalty_points;
    });
  }

  /**
   * Redeem loyalty points
   */
  static async redeemLoyaltyPoints(customerId: string, points: number, transactionId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    if (customer.loyalty_points < points) {
      throw new ValidationError('Insufficient loyalty points');
    }

    return await prisma.$transaction(async (tx) => {
      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          loyalty_points: {
            decrement: points,
          },
        },
      });

      await tx.loyaltyLedger.create({
        data: {
          customer_id: customerId,
          points_delta: -points,
          balance_after: updatedCustomer.loyalty_points,
          reason: 'Points redeemed as discount',
          transaction_id: transactionId,
        },
      });

      return updatedCustomer.loyalty_points;
    });
  }
}

export default CustomerCreditService;

