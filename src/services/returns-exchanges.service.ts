import { PrismaClient, UserRole, RefundMethod } from '@prisma/client';
import { AuthorizationError, ValidationError, NotFoundError } from '../utils/errors';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

// ===== INTERFACES =====

interface LookupSaleParams {
  transaction_number?: string;
  barcode?: string;
}

interface ProcessRefundParams {
  transaction_id: string;
  items: Array<{
    item_id: string;
    quantity: number;
  }>;
  refund_method: RefundMethod;
  reason: string;
}

interface ProcessExchangeParams {
  original_transaction_id: string;
  return_items: Array<{
    item_id: string;
    quantity: number;
  }>;
  new_items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    discount_percentage?: number;
  }>;
  session_id: string;
  payment_method: string;
}

interface ServiceContext {
  actorId: string;
  actorRole: UserRole;
}

// ===== SERVICE =====

export class ReturnsExchangesService {
  /**
   * Lookup a sale by transaction number or receipt barcode
   */
  static async lookupSale(params: LookupSaleParams, actorRole: UserRole) {
    if (!['cashier', 'admin', 'owner_ultimate_super_admin'].includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions to lookup sales');
    }

    let transaction;

    if (params.transaction_number) {
      transaction = await prisma.pOSTransaction.findUnique({
        where: { transaction_number: params.transaction_number },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  barcode: true,
                },
              },
            },
          },
          customer: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              customer_number: true,
            },
          },
          session: {
            select: {
              session_number: true,
              cashier: {
                select: {
                  display_name: true,
                },
              },
            },
          },
        },
      });
    }

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    return transaction;
  }

  /**
   * Process a refund (full or partial)
   */
  static async processRefund(params: ProcessRefundParams, context: ServiceContext) {
    if (!['cashier', 'admin', 'owner_ultimate_super_admin'].includes(context.actorRole)) {
      throw new AuthorizationError('Insufficient permissions to process refund');
    }

    // Get original transaction
    const originalTransaction = await prisma.pOSTransaction.findUnique({
      where: { id: params.transaction_id },
      include: {
        items: true,
        session: true,
      },
    });

    if (!originalTransaction) {
      throw new NotFoundError('Original transaction not found');
    }

    // Validate return window (configurable, default 30 days)
    const returnWindowDays = 30;
    const daysSinceSale = Math.floor(
      (Date.now() - originalTransaction.transaction_date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceSale > returnWindowDays) {
      throw new ValidationError(`Return window exceeded. Max ${returnWindowDays} days.`);
    }

    // Calculate refund amount
    let refundAmount = 0;
    const refundItems: Array<{
      original_item_id: string;
      product_id: string;
      quantity: number;
      unit_price: any;
      line_total: number;
    }> = [];

    for (const returnItem of params.items) {
      const originalItem = originalTransaction.items.find(item => item.id === returnItem.item_id);
      if (!originalItem) {
        throw new NotFoundError(`Item ${returnItem.item_id} not found in original transaction`);
      }

      if (returnItem.quantity > originalItem.quantity) {
        throw new ValidationError('Return quantity exceeds original quantity');
      }

      const itemRefundAmount = (Number(originalItem.line_total) / originalItem.quantity) * returnItem.quantity;
      refundAmount += itemRefundAmount;

      refundItems.push({
        original_item_id: originalItem.id,
        product_id: originalItem.product_id,
        quantity: returnItem.quantity,
        unit_price: originalItem.unit_price,
        line_total: itemRefundAmount,
      });
    }

    // Create refund transaction in database transaction
    return await prisma.$transaction(async (tx) => {
      // Create refund transaction
      const refundTransaction = await tx.pOSTransaction.create({
        data: {
          transaction_number: await this.generateRefundNumber(tx),
          session_id: originalTransaction.session_id,
          transaction_type: 'REFUND',
          customer_id: originalTransaction.customer_id,
          subtotal: -refundAmount,
          tax_amount: 0,
          discount_amount: 0,
          total_amount: -refundAmount,
          payment_method: params.refund_method === 'ORIGINAL_PAYMENT' 
            ? originalTransaction.payment_method 
            : (params.refund_method === 'STORE_CREDIT' || params.refund_method === 'GIFT_CARD' ? 'CASH' : params.refund_method) as any,
          amount_tendered: refundAmount,
          change_amount: 0,
          is_refund: true,
          original_transaction_id: originalTransaction.id,
          refund_method: params.refund_method,
          notes: params.reason,
          items: {
            create: refundItems.map(item => ({
              product_id: item.product_id,
              quantity: -item.quantity,
              unit_price: item.unit_price,
              line_total: -item.line_total,
              original_price: item.unit_price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Restore stock for returned items
      for (const item of refundItems) {
        await tx.product.update({
          where: { id: item.product_id },
          data: {
            stock_quantity: {
              increment: item.quantity,
            },
          },
        });

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            product_id: item.product_id,
            movement_type: 'IN',
            quantity: item.quantity,
            reference_number: refundTransaction.transaction_number,
            reason: 'POS Refund',
            performed_by_id: context.actorId,
          },
        });
      }

      // If refund to store credit, add to customer balance
      if (params.refund_method === 'STORE_CREDIT' && originalTransaction.customer_id) {
        const customer = await tx.customer.update({
          where: { id: originalTransaction.customer_id },
          data: {
            store_credit_balance: {
              increment: refundAmount,
            },
          },
        });

        // Create store credit ledger entry
        await tx.storeCreditLedger.create({
          data: {
            customer_id: originalTransaction.customer_id,
            delta: refundAmount,
            balance_after: Number(customer.store_credit_balance),
            reason: `Refund from ${originalTransaction.transaction_number}`,
            transaction_id: refundTransaction.id,
            created_by_id: context.actorId,
          },
        });
      }

      // Update session totals
      await tx.pOSSession.update({
        where: { id: originalTransaction.session_id },
        data: {
          total_sales: {
            decrement: refundAmount,
          },
        },
      });

      // Create audit log
      await AuditService.createLog({
        actorUserId: context.actorId,
        action: 'ISSUE_REFUND',
        metadata: {
          original_transaction: originalTransaction.transaction_number,
          refund_transaction: refundTransaction.transaction_number,
          refund_amount: refundAmount,
          refund_method: params.refund_method,
          items_count: refundItems.length,
        },
      });

      return refundTransaction;
    });
  }

  /**
   * Process an exchange (return + new sale in one transaction)
   */
  static async processExchange(params: ProcessExchangeParams, context: ServiceContext) {
    if (!['cashier', 'admin', 'owner_ultimate_super_admin'].includes(context.actorRole)) {
      throw new AuthorizationError('Insufficient permissions to process exchange');
    }

    // Get original transaction
    const originalTransaction = await prisma.pOSTransaction.findUnique({
      where: { id: params.original_transaction_id },
      include: {
        items: true,
      },
    });

    if (!originalTransaction) {
      throw new NotFoundError('Original transaction not found');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Process return portion (credit)
      let returnAmount = 0;
      for (const returnItem of params.return_items) {
        const originalItem = originalTransaction.items.find(i => i.id === returnItem.item_id);
        if (!originalItem) continue;

        const itemReturnAmount = (Number(originalItem.line_total) / originalItem.quantity) * returnItem.quantity;
        returnAmount += itemReturnAmount;

        // Restore stock
        await tx.product.update({
          where: { id: originalItem.product_id },
          data: { stock_quantity: { increment: returnItem.quantity } },
        });
      }

      // 2. Process new sale portion (debit)
      let newSaleAmount = 0;
      const newSaleItems = [];

      for (const newItem of params.new_items) {
        const product = await tx.product.findUnique({
          where: { id: newItem.product_id },
        });

        if (!product) {
          throw new NotFoundError(`Product ${newItem.product_id} not found`);
        }

        if (product.stock_quantity < newItem.quantity) {
          throw new ValidationError(`Insufficient stock for ${product.name}`);
        }

        const lineTotal = newItem.quantity * newItem.unit_price * (1 - (newItem.discount_percentage || 0) / 100);
        newSaleAmount += lineTotal;

        newSaleItems.push({
          product_id: newItem.product_id,
          quantity: newItem.quantity,
          unit_price: newItem.unit_price,
          discount_percentage: newItem.discount_percentage || 0,
          line_total: lineTotal,
          original_price: newItem.unit_price,
        });

        // Reduce stock
        await tx.product.update({
          where: { id: newItem.product_id },
          data: { stock_quantity: { decrement: newItem.quantity } },
        });
      }

      // 3. Calculate net amount (new - return)
      const netAmount = newSaleAmount - returnAmount;

      // 4. Create exchange transaction
      const exchangeTransaction = await tx.pOSTransaction.create({
        data: {
          transaction_number: await this.generateExchangeNumber(tx),
          session_id: params.session_id,
          transaction_type: 'EXCHANGE',
          customer_id: originalTransaction.customer_id,
          subtotal: newSaleAmount,
          tax_amount: 0,
          discount_amount: 0,
          total_amount: netAmount,
          payment_method: params.payment_method as any,
          amount_tendered: netAmount > 0 ? netAmount : 0,
          change_amount: 0,
          original_transaction_id: params.original_transaction_id,
          notes: `Exchange for ${originalTransaction.transaction_number}`,
          items: {
            create: newSaleItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // 5. Update session
      await tx.pOSSession.update({
        where: { id: params.session_id },
        data: {
          total_sales: { increment: netAmount },
          total_transactions: { increment: 1 },
        },
      });

      // 6. Create audit log
      await AuditService.createLog({
        actorUserId: context.actorId,
        action: 'PROCESS_EXCHANGE',
        metadata: {
          original_transaction: originalTransaction.transaction_number,
          exchange_transaction: exchangeTransaction.transaction_number,
          return_amount: returnAmount,
          new_sale_amount: newSaleAmount,
          net_amount: netAmount,
        },
      });

      return exchangeTransaction;
    });
  }

  /**
   * Generate refund transaction number
   */
  private static async generateRefundNumber(tx: any): Promise<string> {
    const count = await tx.pOSTransaction.count({
      where: { transaction_type: 'REFUND' },
    });
    return `REF-${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Generate exchange transaction number
   */
  private static async generateExchangeNumber(tx: any): Promise<string> {
    const count = await tx.pOSTransaction.count({
      where: { transaction_type: 'EXCHANGE' },
    });
    return `EXC-${String(count + 1).padStart(6, '0')}`;
  }
}

export default ReturnsExchangesService;

