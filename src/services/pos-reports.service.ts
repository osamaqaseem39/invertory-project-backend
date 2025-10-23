import { PrismaClient, UserRole } from '@prisma/client';
import { AuthorizationError } from '../utils/errors';

const prisma = new PrismaClient();

// ===== INTERFACES =====

interface DateRangeParams {
  date_from: Date;
  date_to: Date;
}

interface TopItemsParams extends DateRangeParams {
  limit?: number;
}

interface DiscountLeakageParams extends DateRangeParams {
  by_cashier?: boolean;
}

interface SalesByHourParams {
  date: Date;
}

// ===== SERVICE =====

export class POSReportsService {
  /**
   * Get top selling items
   */
  static async getTopItems(params: TopItemsParams, actorRole: UserRole) {
    if (!['admin', 'owner_ultimate_super_admin'].includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const limit = params.limit || 10;

    // Get all transactions in date range
    const transactions = await prisma.pOSTransaction.findMany({
      where: {
        transaction_date: {
          gte: params.date_from,
          lte: params.date_to,
        },
        is_refund: false,
      },
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
      },
    });

    // Aggregate by product
    const productStats: Record<string, {
      product_id: string;
      product_name: string;
      sku: string;
      quantity_sold: number;
      total_revenue: number;
      transactions_count: number;
    }> = {};

    for (const transaction of transactions) {
      for (const item of transaction.items) {
        const key = item.product_id;
        if (!productStats[key]) {
          productStats[key] = {
            product_id: item.product_id,
            product_name: item.product.name,
            sku: item.product.sku,
            quantity_sold: 0,
            total_revenue: 0,
            transactions_count: 0,
          };
        }

        productStats[key].quantity_sold += item.quantity;
        productStats[key].total_revenue += Number(item.line_total);
        productStats[key].transactions_count += 1;
      }
    }

    // Sort by revenue and take top N
    const topItems = Object.values(productStats)
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit);

    return topItems;
  }

  /**
   * Get discount leakage report
   */
  static async getDiscountLeakage(params: DiscountLeakageParams, actorRole: UserRole) {
    if (!['admin', 'owner_ultimate_super_admin'].includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const transactions = await prisma.pOSTransaction.findMany({
      where: {
        transaction_date: {
          gte: params.date_from,
          lte: params.date_to,
        },
      },
      include: {
        session: {
          include: {
            cashier: {
              select: {
                id: true,
                display_name: true,
                username: true,
              },
            },
          },
        },
        items: true,
      },
    });

    if (params.by_cashier) {
      // Group by cashier
      const byCashier: Record<string, {
        cashier_name: string;
        total_discount: number;
        transactions_count: number;
        avg_discount_per_transaction: number;
      }> = {};

      for (const transaction of transactions) {
        const cashierId = transaction.session.cashier.id;
        if (!byCashier[cashierId]) {
          byCashier[cashierId] = {
            cashier_name: transaction.session.cashier.display_name,
            total_discount: 0,
            transactions_count: 0,
            avg_discount_per_transaction: 0,
          };
        }

        const transactionDiscount = Number(transaction.discount_amount) + 
                                   (transaction.coupon_discount ? Number(transaction.coupon_discount) : 0);
        byCashier[cashierId].total_discount += transactionDiscount;
        byCashier[cashierId].transactions_count += 1;
      }

      // Calculate averages
      Object.values(byCashier).forEach(stats => {
        stats.avg_discount_per_transaction = stats.total_discount / stats.transactions_count;
      });

      return Object.values(byCashier).sort((a, b) => b.total_discount - a.total_discount);
    } else {
      // Overall summary
      const totalDiscount = transactions.reduce((sum, t) => {
        return sum + Number(t.discount_amount) + (t.coupon_discount ? Number(t.coupon_discount) : 0);
      }, 0);

      const totalSales = transactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
      const discountPercentage = totalSales > 0 ? (totalDiscount / (totalSales + totalDiscount)) * 100 : 0;

      return {
        total_discount: totalDiscount,
        total_sales: totalSales,
        discount_percentage: discountPercentage,
        transactions_count: transactions.length,
        avg_discount_per_transaction: totalDiscount / transactions.length,
      };
    }
  }

  /**
   * Get sales by hour
   */
  static async getSalesByHour(params: SalesByHourParams, actorRole: UserRole) {
    if (!['admin', 'owner_ultimate_super_admin'].includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const startOfDay = new Date(params.date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(params.date);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await prisma.pOSTransaction.findMany({
      where: {
        transaction_date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        is_refund: false,
      },
    });

    // Group by hour
    const byHour: Record<number, { hour: number; sales: number; transactions: number }> = {};

    for (let hour = 0; hour < 24; hour++) {
      byHour[hour] = { hour, sales: 0, transactions: 0 };
    }

    for (const transaction of transactions) {
      const hour = transaction.transaction_date.getHours();
      byHour[hour].sales += Number(transaction.total_amount);
      byHour[hour].transactions += 1;
    }

    return Object.values(byHour);
  }

  /**
   * Get void and refund rates
   */
  static async getVoidRefundRates(params: DateRangeParams, actorRole: UserRole) {
    if (!['admin', 'owner_ultimate_super_admin'].includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const [totalTransactions, refundTransactions] = await Promise.all([
      prisma.pOSTransaction.count({
        where: {
          transaction_date: {
            gte: params.date_from,
            lte: params.date_to,
          },
        },
      }),
      prisma.pOSTransaction.count({
        where: {
          transaction_date: {
            gte: params.date_from,
            lte: params.date_to,
          },
          is_refund: true,
        },
      }),
    ]);

    const refundRate = totalTransactions > 0 ? (refundTransactions / totalTransactions) * 100 : 0;

    return {
      total_transactions: totalTransactions,
      refund_transactions: refundTransactions,
      refund_rate_percentage: refundRate,
    };
  }

  /**
   * Get comprehensive sales summary
   */
  static async getSalesSummary(params: DateRangeParams, actorRole: UserRole) {
    if (!['admin', 'owner_ultimate_super_admin'].includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const transactions = await prisma.pOSTransaction.findMany({
      where: {
        transaction_date: {
          gte: params.date_from,
          lte: params.date_to,
        },
      },
    });

    // Sales transactions only (not refunds)
    const sales = transactions.filter(t => !t.is_refund);
    const refunds = transactions.filter(t => t.is_refund);

    // Group by payment method
    const byPaymentMethod: Record<string, { total: number; count: number }> = {};

    for (const transaction of sales) {
      const method = transaction.payment_method;
      if (!byPaymentMethod[method]) {
        byPaymentMethod[method] = { total: 0, count: 0 };
      }
      byPaymentMethod[method].total += Number(transaction.total_amount);
      byPaymentMethod[method].count += 1;
    }

    // Totals
    const totalSales = sales.reduce((sum, t) => sum + Number(t.total_amount), 0);
    const totalRefunds = refunds.reduce((sum, t) => sum + Math.abs(Number(t.total_amount)), 0);
    const netSales = totalSales - totalRefunds;

    return {
      period: {
        from: params.date_from,
        to: params.date_to,
      },
      sales: {
        total: totalSales,
        count: sales.length,
        average_transaction: sales.length > 0 ? totalSales / sales.length : 0,
      },
      refunds: {
        total: totalRefunds,
        count: refunds.length,
        rate_percentage: sales.length > 0 ? (refunds.length / sales.length) * 100 : 0,
      },
      net_sales: netSales,
      by_payment_method: byPaymentMethod,
    };
  }

  /**
   * Export data to CSV format
   */
  static async exportToCSV(data: any[]): Promise<string> {
    if (!data || data.length === 0) {
      return '';
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    let csv = headers.join(',') + '\n';

    // Add rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csv += values.join(',') + '\n';
    }

    return csv;
  }
}

export default POSReportsService;





