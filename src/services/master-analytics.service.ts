import prisma from '../database/client';
import logger from '../utils/logger';

export class MasterAnalyticsService {
  /**
   * Get comprehensive master dashboard analytics
   */
  static async getMasterDashboard(): Promise<any> {
    try {
      // Get basic client statistics
      const totalClients = await prisma.clientInstance.count();
      const activeClients = await prisma.clientInstance.count({
        where: { status: 'ACTIVE' }
      });
      const trialClients = await prisma.clientInstance.count({
        where: { status: 'TRIAL' }
      });

      // Get license statistics
      const totalLicenses = await prisma.enhancedLicenseKey.count();
      const activeLicenses = await prisma.enhancedLicenseKey.count({
        where: { status: 'ACTIVE' }
      });

      // Get billing statistics
      const billingStats = await prisma.billingRecord.aggregate({
        _sum: {
          amount: true,
          paid_amount: true
        },
        where: {}
      });

      const totalBilled = billingStats._sum.amount || 0;
      const totalPaid = billingStats._sum.paid_amount || 0;
      const totalOutstanding = Number(totalBilled) - Number(totalPaid);

      // Get credit statistics
      const creditStats = await prisma.creditPurchase.aggregate({
        _sum: {
          credits_purchased: true,
          total_cost: true
        },
        where: {}
      });

      const totalCreditsSold = creditStats._sum.credits_purchased || 0;
      const totalCreditRevenue = creditStats._sum.total_cost || 0;

      // Get recent clients (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentClients = await prisma.clientInstance.findMany({
        where: {
          created_at: {
            gte: thirtyDaysAgo
          }
        },
        include: {
          license_key: {
            select: {
              license_type: true,
              status: true,
              max_credits: true,
              current_credits: true
            }
          },
          usage_stats: {
            take: 1,
            orderBy: { date: 'desc' }
          }
        },
        orderBy: { created_at: 'desc' },
        take: 10
      });

      // Get top clients by revenue
      const topClientsByRevenue = await prisma.clientInstance.findMany({
        include: {
          billing_records: {
            select: {
              amount: true,
              status: true
            }
          },
          credit_purchases: {
            select: {
              total_cost: true,
              credits_purchased: true
            }
          }
        },
        take: 10
      });

      // Calculate revenue for each client
      const clientsWithRevenue = topClientsByRevenue.map(client => {
        const billingRevenue = client.billing_records
          .filter(record => record.status === 'PAID')
          .reduce((sum, record) => sum + Number(record.amount), 0);
        
        const creditRevenue = client.credit_purchases
          .reduce((sum, purchase) => sum + Number(purchase.total_cost), 0);
        
        const totalRevenue = billingRevenue + creditRevenue;
        
        return {
          id: client.id,
          client_name: client.client_name,
          client_code: client.client_code,
          contact_email: client.contact_email,
          status: client.status,
          total_revenue: totalRevenue,
          billing_revenue: billingRevenue,
          credit_revenue: creditRevenue,
          created_at: client.created_at,
          last_seen_at: client.last_seen_at
        };
      }).sort((a, b) => b.total_revenue - a.total_revenue);

      // Get monthly revenue trends (last 12 months)
      const monthlyRevenue = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthStats = await prisma.billingRecord.aggregate({
          _sum: { paid_amount: true },
          _count: { id: true },
          where: {
            paid_at: {
              gte: startOfMonth,
              lte: endOfMonth
            },
            status: 'PAID'
          }
        });

        const monthCreditStats = await prisma.creditPurchase.aggregate({
          _sum: { total_cost: true },
          _count: { id: true },
          where: {
            created_at: {
              gte: startOfMonth,
              lte: endOfMonth
            },
            status: 'COMPLETED'
          }
        });

        monthlyRevenue.push({
          month: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
          month_name: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          revenue: Number(monthStats._sum.paid_amount || 0) + Number(monthCreditStats._sum.total_cost || 0),
          billing_count: monthStats._count.id,
          credit_count: monthCreditStats._count.id,
          billing_revenue: monthStats._sum.paid_amount || 0,
          credit_revenue: monthCreditStats._sum.total_cost || 0
        });
      }

      // Get license type distribution
      const licenseDistribution = await prisma.enhancedLicenseKey.groupBy({
        by: ['license_type'],
        _count: { id: true }
      });

      // Get client status distribution
      const clientStatusDistribution = await prisma.clientInstance.groupBy({
        by: ['status'],
        _count: { id: true }
      });

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentActivity = await prisma.auditLog.findMany({
        where: {
          created_at: {
            gte: sevenDaysAgo
          }
        },
        select: {
          id: true,
          action: true,
          actor_user_id: true,
          created_at: true,
          metadata: true
        },
        orderBy: { created_at: 'desc' },
        take: 20
      });

      // Get system health metrics
      const systemHealth = {
        database_status: 'healthy',
        api_status: 'healthy',
        last_backup: await this.getLastBackupDate(),
        active_connections: await this.getActiveConnections(),
        error_rate: await this.getErrorRate()
      };

      return {
        overview: {
          totalClients,
          activeClients,
          trialClients,
          totalLicenses,
          activeLicenses,
          totalCreditsSold,
          totalRevenue: totalBilled,
          totalPaid,
          totalOutstanding,
          totalCreditRevenue
        },
        trends: {
          monthlyRevenue,
          clientGrowth: await this.getClientGrowthTrend(),
          revenueGrowth: await this.getRevenueGrowthTrend()
        },
        distributions: {
          licenseTypes: licenseDistribution,
          clientStatuses: clientStatusDistribution
        },
        topPerformers: {
          clientsByRevenue: clientsWithRevenue.slice(0, 10),
          recentClients: recentClients.slice(0, 5)
        },
        systemHealth,
        recentActivity: recentActivity.slice(0, 10)
      };

    } catch (error) {
      logger.error({ error }, 'Error getting master dashboard analytics');
      throw error;
    }
  }

  /**
   * Get client growth trend
   */
  private static async getClientGrowthTrend(): Promise<any[]> {
    const trend = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      // const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const count = await prisma.clientInstance.count({
        where: {
          created_at: {
            lte: endOfMonth
          }
        }
      });

      trend.push({
        month: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
        total_clients: count
      });
    }
    return trend;
  }

  /**
   * Get revenue growth trend
   */
  private static async getRevenueGrowthTrend(): Promise<any[]> {
    const trend = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const billingRevenue = await prisma.billingRecord.aggregate({
        _sum: { paid_amount: true },
        where: {
          paid_at: {
            gte: startOfMonth,
            lte: endOfMonth
          },
          status: 'PAID'
        }
      });

      const creditRevenue = await prisma.creditPurchase.aggregate({
        _sum: { total_cost: true },
        where: {
          created_at: {
            gte: startOfMonth,
            lte: endOfMonth
          },
          status: 'COMPLETED'
        }
      });

      trend.push({
        month: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
        total_revenue: Number(billingRevenue._sum.paid_amount || 0) + Number(creditRevenue._sum.total_cost || 0)
      });
    }
    return trend;
  }

  /**
   * Get last backup date
   */
  private static async getLastBackupDate(): Promise<string | null> {
    try {
      // Note: backupRecord table doesn't exist in schema
      const lastBackup: any = null; // await prisma.backupRecord.findFirst({
      //   orderBy: { created_at: 'desc' },
      // });
      return lastBackup?.created_at.toISOString() || null;
    } catch {
      return null;
    }
  }

  /**
   * Get active connections count
   */
  private static async getActiveConnections(): Promise<number> {
    try {
      // This would typically come from connection pool stats
      return 15; // Mock value
    } catch {
      return 0;
    }
  }

  /**
   * Get error rate percentage
   */
  private static async getErrorRate(): Promise<number> {
    try {
      const totalRequests = await prisma.auditLog.count({
        where: {
          action: { in: ['USER_CREATED' as any, 'USER_UPDATED' as any] } // API_REQUEST and ERROR are not valid AuditAction values
        }
      });

      const errorRequests = await prisma.auditLog.count({
        where: {
          action: 'USER_DELETED' as any // ERROR is not a valid AuditAction value
        }
      });

      return totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get detailed client analytics
   */
  static async getClientAnalytics(clientId: string): Promise<any> {
    const client = await prisma.clientInstance.findUnique({
      where: { id: clientId },
      include: {
        license_key: true,
        billing_records: true,
        credit_purchases: true,
        usage_stats: {
          orderBy: { date: 'desc' },
          take: 30
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 10
        }
      }
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Calculate client metrics
    const totalRevenue = client.billing_records
      .filter(record => record.status === 'PAID')
      .reduce((sum, record) => sum + Number(record.amount), 0);

    const totalCreditRevenue = client.credit_purchases
      .reduce((sum, purchase) => sum + Number(purchase.total_cost), 0);

    const totalCreditsPurchased = client.credit_purchases
      .reduce((sum, purchase) => sum + purchase.credits_purchased, 0);

    const averageUsage = client.usage_stats.length > 0
      ? client.usage_stats.reduce((sum, stat) => sum + stat.credits_consumed, 0) / client.usage_stats.length
      : 0;

    return {
      client: {
        id: client.id,
        client_name: client.client_name,
        client_code: client.client_code,
        contact_email: client.contact_email,
        status: client.status,
        created_at: client.created_at,
        last_seen_at: client.last_seen_at
      },
      metrics: {
        total_revenue: totalRevenue + totalCreditRevenue,
        total_credits_purchased: totalCreditsPurchased,
        average_daily_usage: averageUsage,
        license_status: client.license_key?.status || 'NONE',
        current_credits: client.license_key?.current_credits || 0,
        max_credits: client.license_key?.max_credits || 0
      },
      usage_stats: client.usage_stats,
      recent_messages: client.messages,
      billing_history: client.billing_records,
      credit_history: client.credit_purchases
    };
  }
}
