import prisma from '../database/client';
import logger from '../utils/logger';

export class MasterAnalyticsSimpleService {
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

      const totalBilled = Number(billingStats._sum.amount || 0);
      const totalPaid = Number(billingStats._sum.paid_amount || 0);
      const totalOutstanding = totalBilled - totalPaid;

      // Get credit statistics
      const creditStats = await prisma.creditPurchase.aggregate({
        _sum: {
          credits_purchased: true,
          total_cost: true
        },
        where: {}
      });

      const totalCreditsSold = Number(creditStats._sum.credits_purchased || 0);
      const totalCreditRevenue = Number(creditStats._sum.total_cost || 0);

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
          billing_revenue: Number(monthStats._sum.paid_amount || 0),
          credit_revenue: Number(monthCreditStats._sum.total_cost || 0)
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
          monthlyRevenue
        },
        distributions: {
          licenseTypes: licenseDistribution,
          clientStatuses: clientStatusDistribution
        },
        topPerformers: {
          clientsByRevenue: clientsWithRevenue.slice(0, 10),
          recentClients: recentClients.slice(0, 5)
        },
        systemHealth: {
          database_status: 'healthy',
          api_status: 'healthy',
          last_backup: null,
          active_connections: 15,
          error_rate: 0
        }
      };

    } catch (error) {
      logger.error('Error getting master dashboard analytics:', error);
      throw error;
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
