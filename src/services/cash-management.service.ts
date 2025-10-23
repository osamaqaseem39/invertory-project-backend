import { PrismaClient, UserRole, CashEventType } from '@prisma/client';
import { AuthorizationError, ValidationError, NotFoundError } from '../utils/errors';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

// ===== INTERFACES =====

interface CashEventContext {
  actorId: string;
  actorRole: UserRole;
}

interface CreateCashEventParams {
  session_id: string;
  type: CashEventType;
  amount?: number;
  reason: string;
  reference?: string;
}

interface ZReportData {
  session: any;
  sales: {
    total: number;
    count: number;
    by_payment_method: Record<string, { total: number; count: number }>;
  };
  cash_events: {
    paid_in: number;
    paid_out: number;
    no_sale_count: number;
  };
  expected_cash: number;
  actual_cash: number;
  variance: number;
  top_products: Array<{
    product_name: string;
    quantity: number;
    total: number;
  }>;
}

// ===== SERVICE =====

export class CashManagementService {
  /**
   * Record a Paid In event
   */
  static async paidIn(params: CreateCashEventParams, context: CashEventContext) {
    // RBAC: Only cashier, admin, owner
    if (!['cashier', 'admin', 'owner_ultimate_super_admin'].includes(context.actorRole)) {
      throw new AuthorizationError('Insufficient permissions to record cash event');
    }

    if (!params.amount || params.amount <= 0) {
      throw new ValidationError('Amount must be greater than zero');
    }

    // Validate session exists and is active
    const session = await prisma.pOSSession.findUnique({
      where: { id: params.session_id },
    });

    if (!session) {
      throw new NotFoundError('POS session not found');
    }

    if (session.status !== 'ACTIVE') {
      throw new ValidationError('POS session is not active');
    }

    return await prisma.$transaction(async (tx) => {
      // Create cash event
      const cashEvent = await tx.cashEvent.create({
        data: {
          session_id: params.session_id,
          type: 'PAID_IN',
          amount: params.amount,
          reason: params.reason,
          reference: params.reference,
          actor_id: context.actorId,
        },
      });

      // Update session totals
      await tx.pOSSession.update({
        where: { id: params.session_id },
        data: {
          total_paid_in: {
            increment: params.amount,
          },
        },
      });

      // Create audit log
      await AuditService.createLog({
        actorUserId: context.actorId,
        action: 'PAID_IN',
        metadata: {
          session_id: params.session_id,
          amount: params.amount,
          reason: params.reason,
        },
      });

      return cashEvent;
    });
  }

  /**
   * Record a Paid Out event
   */
  static async paidOut(params: CreateCashEventParams, context: CashEventContext) {
    // RBAC: Only cashier, admin, owner
    if (!['cashier', 'admin', 'owner_ultimate_super_admin'].includes(context.actorRole)) {
      throw new AuthorizationError('Insufficient permissions to record cash event');
    }

    if (!params.amount || params.amount <= 0) {
      throw new ValidationError('Amount must be greater than zero');
    }

    // Validate session
    const session = await prisma.pOSSession.findUnique({
      where: { id: params.session_id },
    });

    if (!session) {
      throw new NotFoundError('POS session not found');
    }

    if (session.status !== 'ACTIVE') {
      throw new ValidationError('POS session is not active');
    }

    return await prisma.$transaction(async (tx) => {
      // Create cash event
      const cashEvent = await tx.cashEvent.create({
        data: {
          session_id: params.session_id,
          type: 'PAID_OUT',
          amount: params.amount,
          reason: params.reason,
          reference: params.reference,
          actor_id: context.actorId,
        },
      });

      // Update session totals
      await tx.pOSSession.update({
        where: { id: params.session_id },
        data: {
          total_paid_out: {
            increment: params.amount,
          },
        },
      });

      // Create audit log
      await AuditService.createLog({
        actorUserId: context.actorId,
        action: 'PAID_OUT',
        metadata: {
          session_id: params.session_id,
          amount: params.amount,
          reason: params.reason,
        },
      });

      return cashEvent;
    });
  }

  /**
   * Record a No Sale event (open cash drawer)
   */
  static async noSale(params: { session_id: string; reason: string }, context: CashEventContext) {
    // RBAC: Only cashier, admin, owner
    if (!['cashier', 'admin', 'owner_ultimate_super_admin'].includes(context.actorRole)) {
      throw new AuthorizationError('Insufficient permissions to open cash drawer');
    }

    // Validate session
    const session = await prisma.pOSSession.findUnique({
      where: { id: params.session_id },
    });

    if (!session) {
      throw new NotFoundError('POS session not found');
    }

    if (session.status !== 'ACTIVE') {
      throw new ValidationError('POS session is not active');
    }

    // Create cash event
    const cashEvent = await prisma.cashEvent.create({
      data: {
        session_id: params.session_id,
        type: 'NO_SALE',
        amount: null,
        reason: params.reason,
        actor_id: context.actorId,
      },
    });

    // Create audit log
    await AuditService.createLog({
      actorUserId: context.actorId,
      action: 'NO_SALE',
      metadata: {
        session_id: params.session_id,
        reason: params.reason,
      },
    });

    return cashEvent;
  }

  /**
   * Get all cash events for a session
   */
  static async getCashEvents(sessionId: string, actorRole: UserRole) {
    // RBAC: Only cashier (own), admin, owner
    if (!['cashier', 'admin', 'owner_ultimate_super_admin'].includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions to view cash events');
    }

    const events = await prisma.cashEvent.findMany({
      where: { session_id: sessionId },
      include: {
        actor: {
          select: {
            id: true,
            display_name: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    return events;
  }

  /**
   * Generate Z-Report (End of Day Report)
   */
  static async generateZReport(sessionId: string, actorRole: UserRole): Promise<ZReportData> {
    // RBAC: Only cashier (own), admin, owner
    if (!['cashier', 'admin', 'owner_ultimate_super_admin'].includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions to generate Z-Report');
    }

    // Get session with all details
    const session = await prisma.pOSSession.findUnique({
      where: { id: sessionId },
      include: {
        cashier: {
          select: {
            id: true,
            display_name: true,
            username: true,
          },
        },
        transactions: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                  },
                },
              },
            },
          },
        },
        cash_events: true,
      },
    });

    if (!session) {
      throw new NotFoundError('POS session not found');
    }

    // Calculate sales by payment method
    const salesByPaymentMethod: Record<string, { total: number; count: number }> = {};
    let totalSales = 0;
    let totalTransactions = 0;

    for (const transaction of session.transactions) {
      if (!transaction.is_refund) {
        const method = transaction.payment_method;
        if (!salesByPaymentMethod[method]) {
          salesByPaymentMethod[method] = { total: 0, count: 0 };
        }
        salesByPaymentMethod[method].total += Number(transaction.total_amount);
        salesByPaymentMethod[method].count += 1;
        totalSales += Number(transaction.total_amount);
        totalTransactions += 1;
      }
    }

    // Calculate cash events
    let totalPaidIn = 0;
    let totalPaidOut = 0;
    let noSaleCount = 0;

    for (const event of session.cash_events) {
      if (event.type === 'PAID_IN') {
        totalPaidIn += Number(event.amount || 0);
      } else if (event.type === 'PAID_OUT') {
        totalPaidOut += Number(event.amount || 0);
      } else if (event.type === 'NO_SALE') {
        noSaleCount += 1;
      }
    }

    // Calculate top products
    const productSales: Record<string, { name: string; quantity: number; total: number }> = {};

    for (const transaction of session.transactions) {
      if (!transaction.is_refund) {
        for (const item of transaction.items) {
          const productId = item.product_id;
          if (!productSales[productId]) {
            productSales[productId] = {
              name: item.product.name,
              quantity: 0,
              total: 0,
            };
          }
          productSales[productId].quantity += item.quantity;
          productSales[productId].total += Number(item.line_total);
        }
      }
    }

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(p => ({
        product_name: p.name,
        quantity: p.quantity,
        total: p.total,
      }));

    // Calculate expected vs actual cash
    const startingCash = Number(session.starting_cash);
    const cashSales = salesByPaymentMethod['CASH']?.total || 0;
    const expectedCash = startingCash + cashSales + totalPaidIn - totalPaidOut;
    const actualCash = Number(session.ending_cash || 0);
    const variance = actualCash - expectedCash;

    const report: ZReportData = {
      session: {
        session_number: session.session_number,
        cashier: session.cashier.display_name,
        start_time: session.start_time,
        end_time: session.end_time,
        starting_cash: startingCash,
        ending_cash: actualCash,
      },
      sales: {
        total: totalSales,
        count: totalTransactions,
        by_payment_method: salesByPaymentMethod,
      },
      cash_events: {
        paid_in: totalPaidIn,
        paid_out: totalPaidOut,
        no_sale_count: noSaleCount,
      },
      expected_cash: expectedCash,
      actual_cash: actualCash,
      variance: variance,
      top_products: topProducts,
    };

    return report;
  }

  /**
   * Generate X-Report (Mid-Day Report - Session Still Active)
   */
  static async generateXReport(sessionId: string, actorRole: UserRole): Promise<ZReportData> {
    // Same as Z-Report but doesn't close session
    return await this.generateZReport(sessionId, actorRole);
  }

  /**
   * Get Cash Summary for Session
   */
  static async getCashSummary(sessionId: string, actorRole: UserRole) {
    if (!['cashier', 'admin', 'owner_ultimate_super_admin'].includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const session = await prisma.pOSSession.findUnique({
      where: { id: sessionId },
      include: {
        transactions: true,
        cash_events: true,
      },
    });

    if (!session) {
      throw new NotFoundError('POS session not found');
    }

    // Calculate cash sales
    const cashSales = session.transactions
      .filter(t => !t.is_refund && t.payment_method === 'CASH')
      .reduce((sum, t) => sum + Number(t.total_amount), 0);

    const expectedCash = 
      Number(session.starting_cash) +
      cashSales +
      Number(session.total_paid_in) -
      Number(session.total_paid_out);

    return {
      starting_cash: Number(session.starting_cash),
      cash_sales: cashSales,
      paid_in: Number(session.total_paid_in),
      paid_out: Number(session.total_paid_out),
      expected_cash: expectedCash,
      ending_cash: Number(session.ending_cash || 0),
      variance: Number(session.ending_cash || 0) - expectedCash,
    };
  }
}

export default CashManagementService;

