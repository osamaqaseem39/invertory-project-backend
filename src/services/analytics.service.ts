import { PrismaClient, UserRole } from '@prisma/client';
import { AuthorizationError } from '../utils/errors';

const prisma = new PrismaClient();

// ===== INTERFACES =====

interface DateRangeParams {
  date_from: Date;
  date_to: Date;
}

interface SalesAnalytics {
  overview: {
    total_sales: number;
    total_transactions: number;
    average_transaction: number;
    total_customers: number;
    unique_customers: number;
  };
  trends: {
    sales_growth_percentage: number;
    transaction_growth_percentage: number;
    best_day: { date: string; sales: number };
    worst_day: { date: string; sales: number };
  };
  payment_methods: Record<string, {
    total: number;
    count: number;
    percentage: number;
  }>;
  hourly_distribution: Array<{
    hour: number;
    sales: number;
    transactions: number;
  }>;
  top_products: Array<{
    product_id: string;
    product_name: string;
    sku: string;
    quantity_sold: number;
    revenue: number;
    profit?: number;
  }>;
  cashier_performance: Array<{
    cashier_id: string;
    cashier_name: string;
    total_sales: number;
    transactions_count: number;
    average_transaction: number;
    total_discounts: number;
  }>;
}

// ===== SERVICE =====

export class AnalyticsService {
  /**
   * Get comprehensive sales analytics
   */
  static async getSalesAnalytics(params: DateRangeParams, actorRole: UserRole): Promise<SalesAnalytics> {
    if (!['admin', 'owner_ultimate_super_admin'].includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions to view analytics');
    }

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
                cost: true,
              },
            },
          },
        },
        session: {
          include: {
            cashier: {
              select: {
                id: true,
                display_name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
          },
        },
      },
    });

    // Calculate overview
    const totalSales = transactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
    const totalTransactions = transactions.length;
    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    
    const uniqueCustomers = new Set(
      transactions.filter(t => t.customer_id).map(t => t.customer_id)
    ).size;

    const totalCustomers = await prisma.customer.count({
      where: {
        created_at: {
          gte: params.date_from,
          lte: params.date_to,
        },
      },
    });

    // Calculate payment method breakdown
    const paymentMethods: Record<string, { total: number; count: number; percentage: number }> = {};
    
    for (const transaction of transactions) {
      const method = transaction.payment_method;
      if (!paymentMethods[method]) {
        paymentMethods[method] = { total: 0, count: 0, percentage: 0 };
      }
      paymentMethods[method].total += Number(transaction.total_amount);
      paymentMethods[method].count += 1;
    }

    // Calculate percentages
    Object.values(paymentMethods).forEach(method => {
      method.percentage = totalSales > 0 ? (method.total / totalSales) * 100 : 0;
    });

    // Calculate sales by day
    const salesByDay: Record<string, number> = {};
    
    for (const transaction of transactions) {
      const dateKey = transaction.transaction_date.toISOString().split('T')[0];
      if (!salesByDay[dateKey]) {
        salesByDay[dateKey] = 0;
      }
      salesByDay[dateKey] += Number(transaction.total_amount);
    }

    const sortedDays = Object.entries(salesByDay).sort((a, b) => b[1] - a[1]);
    const bestDay = sortedDays[0] || ['N/A', 0];
    const worstDay = sortedDays[sortedDays.length - 1] || ['N/A', 0];

    // Calculate hourly distribution
    const hourlyData: Record<number, { sales: number; transactions: number }> = {};
    
    for (let hour = 0; hour < 24; hour++) {
      hourlyData[hour] = { sales: 0, transactions: 0 };
    }

    for (const transaction of transactions) {
      const hour = transaction.transaction_date.getHours();
      hourlyData[hour].sales += Number(transaction.total_amount);
      hourlyData[hour].transactions += 1;
    }

    const hourlyDistribution = Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      sales: data.sales,
      transactions: data.transactions,
    }));

    // Calculate top products
    const productStats: Record<string, {
      product_id: string;
      product_name: string;
      sku: string;
      quantity_sold: number;
      revenue: number;
      cost: number;
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
            revenue: 0,
            cost: 0,
          };
        }

        productStats[key].quantity_sold += item.quantity;
        productStats[key].revenue += Number(item.line_total);
        productStats[key].cost += item.quantity * Number(item.product.cost || 0);
      }
    }

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(p => ({
        product_id: p.product_id,
        product_name: p.product_name,
        sku: p.sku,
        quantity_sold: p.quantity_sold,
        revenue: p.revenue,
        profit: p.revenue - p.cost,
      }));

    // Calculate cashier performance
    const cashierStats: Record<string, {
      cashier_id: string;
      cashier_name: string;
      total_sales: number;
      transactions_count: number;
      total_discounts: number;
    }> = {};

    for (const transaction of transactions) {
      const cashierId = transaction.session.cashier.id;
      if (!cashierStats[cashierId]) {
        cashierStats[cashierId] = {
          cashier_id: cashierId,
          cashier_name: transaction.session.cashier.display_name,
          total_sales: 0,
          transactions_count: 0,
          total_discounts: 0,
        };
      }

      cashierStats[cashierId].total_sales += Number(transaction.total_amount);
      cashierStats[cashierId].transactions_count += 1;
      cashierStats[cashierId].total_discounts += Number(transaction.discount_amount) + 
                                                  Number(transaction.coupon_discount || 0);
    }

    const cashierPerformance = Object.values(cashierStats)
      .map(c => ({
        ...c,
        average_transaction: c.transactions_count > 0 ? c.total_sales / c.transactions_count : 0,
      }))
      .sort((a, b) => b.total_sales - a.total_sales);

    // TODO: Calculate growth percentage (compare with previous period)
    const salesGrowthPercentage = 0;
    const transactionGrowthPercentage = 0;

    return {
      overview: {
        total_sales: totalSales,
        total_transactions: totalTransactions,
        average_transaction: averageTransaction,
        total_customers: totalCustomers,
        unique_customers: uniqueCustomers,
      },
      trends: {
        sales_growth_percentage: salesGrowthPercentage,
        transaction_growth_percentage: transactionGrowthPercentage,
        best_day: {
          date: bestDay[0],
          sales: bestDay[1],
        },
        worst_day: {
          date: worstDay[0],
          sales: worstDay[1],
        },
      },
      payment_methods: paymentMethods,
      hourly_distribution: hourlyDistribution,
      top_products: topProducts,
      cashier_performance: cashierPerformance,
    };
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(actorRole: UserRole) {
    if (!['admin', 'owner_ultimate_super_admin', 'cashier'].includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's sales
    const todaySales = await prisma.pOSTransaction.aggregate({
      where: {
        transaction_date: { gte: today },
        is_refund: false,
      },
      _sum: { total_amount: true },
      _count: true,
    });

    // This week's sales
    const weekSales = await prisma.pOSTransaction.aggregate({
      where: {
        transaction_date: { gte: thisWeekStart },
        is_refund: false,
      },
      _sum: { total_amount: true },
      _count: true,
    });

    // This month's sales
    const monthSales = await prisma.pOSTransaction.aggregate({
      where: {
        transaction_date: { gte: thisMonthStart },
        is_refund: false,
      },
      _sum: { total_amount: true },
      _count: true,
    });

    // Active sessions
    const activeSessions = await prisma.pOSSession.count({
      where: { status: 'ACTIVE' },
    });

    // Low stock products
    const lowStockCount = await prisma.product.count({
      where: {
        is_active: true,
        stock_quantity: {
          lte: prisma.product.fields.reorder_level,
        },
      },
    });

    return {
      today: {
        sales: Number(todaySales._sum.total_amount || 0),
        transactions: todaySales._count,
      },
      this_week: {
        sales: Number(weekSales._sum.total_amount || 0),
        transactions: weekSales._count,
      },
      this_month: {
        sales: Number(monthSales._sum.total_amount || 0),
        transactions: monthSales._count,
      },
      active_sessions: activeSessions,
      low_stock_count: lowStockCount,
    };
  }

  /**
   * Get sales trend data (for charts)
   */
  static async getSalesTrend(params: DateRangeParams, period: 'hour' | 'day' | 'week' | 'month', actorRole: UserRole) {
    if (!['admin', 'owner_ultimate_super_admin'].includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const transactions = await prisma.pOSTransaction.findMany({
      where: {
        transaction_date: {
          gte: params.date_from,
          lte: params.date_to,
        },
        is_refund: false,
      },
      select: {
        transaction_date: true,
        total_amount: true,
      },
      orderBy: {
        transaction_date: 'asc',
      },
    });

    // Group by period
    const grouped: Record<string, { sales: number; count: number }> = {};

    for (const transaction of transactions) {
      let key: string;
      
      if (period === 'hour') {
        key = transaction.transaction_date.toISOString().substring(0, 13); // YYYY-MM-DDTHH
      } else if (period === 'day') {
        key = transaction.transaction_date.toISOString().substring(0, 10); // YYYY-MM-DD
      } else if (period === 'week') {
        const weekNum = this.getWeekNumber(transaction.transaction_date);
        key = `${transaction.transaction_date.getFullYear()}-W${weekNum}`;
      } else {
        key = transaction.transaction_date.toISOString().substring(0, 7); // YYYY-MM
      }

      if (!grouped[key]) {
        grouped[key] = { sales: 0, count: 0 };
      }

      grouped[key].sales += Number(transaction.total_amount);
      grouped[key].count += 1;
    }

    return Object.entries(grouped).map(([period_key, data]) => ({
      period: period_key,
      sales: data.sales,
      transactions: data.count,
      average: data.count > 0 ? data.sales / data.count : 0,
    }));
  }

  /**
   * Get week number
   */
  private static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /**
   * Get product performance analysis
   */
  static async getProductPerformance(params: DateRangeParams, actorRole: UserRole) {
    if (!['admin', 'owner_ultimate_super_admin'].includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions');
    }

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
                category: {
                  select: {
                    name: true,
                  },
                },
                cost: true,
                price: true,
              },
            },
          },
        },
      },
    });

    const productStats: Record<string, any> = {};

    for (const transaction of transactions) {
      for (const item of transaction.items) {
        const key = item.product_id;
        if (!productStats[key]) {
          productStats[key] = {
            product_id: item.product_id,
            product_name: item.product.name,
            sku: item.product.sku,
            barcode: item.product.barcode,
            category: item.product.category?.name || 'Uncategorized',
            quantity_sold: 0,
            revenue: 0,
            cost: 0,
            profit_margin: 0,
            transactions_count: 0,
          };
        }

        productStats[key].quantity_sold += item.quantity;
        productStats[key].revenue += Number(item.line_total);
        productStats[key].cost += item.quantity * Number(item.product.cost || 0);
        productStats[key].transactions_count += 1;
      }
    }

    // Calculate profit margins
    Object.values(productStats).forEach((stats: any) => {
      stats.profit = stats.revenue - stats.cost;
      stats.profit_margin = stats.revenue > 0 ? ((stats.profit / stats.revenue) * 100) : 0;
    });

    return Object.values(productStats).sort((a: any, b: any) => b.revenue - a.revenue);
  }

  /**
   * Get category performance
   */
  static async getCategoryPerformance(params: DateRangeParams, actorRole: UserRole) {
    if (!['admin', 'owner_ultimate_super_admin'].includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions');
    }

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
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const categoryStats: Record<string, {
      category_id: string;
      category_name: string;
      revenue: number;
      items_sold: number;
      transactions_count: number;
    }> = {};

    for (const transaction of transactions) {
      for (const item of transaction.items) {
        const categoryId = item.product.category?.id || 'uncategorized';
        const categoryName = item.product.category?.name || 'Uncategorized';

        if (!categoryStats[categoryId]) {
          categoryStats[categoryId] = {
            category_id: categoryId,
            category_name: categoryName,
            revenue: 0,
            items_sold: 0,
            transactions_count: 0,
          };
        }

        categoryStats[categoryId].revenue += Number(item.line_total);
        categoryStats[categoryId].items_sold += item.quantity;
        categoryStats[categoryId].transactions_count += 1;
      }
    }

    return Object.values(categoryStats).sort((a, b) => b.revenue - a.revenue);
  }
}

export default AnalyticsService;





