import { UserRole } from '@prisma/client';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { RBACService } from './rbac.service';
import logger from '../utils/logger';
import prisma from '../database/client';

export interface CreateBillingRecordParams {
  clientInstanceId: string;
  billingType: string;
  amount: number;
  description: string;
  paymentMethod: string;
  actorId: string;
}

export interface AnalyticsFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  clientId?: string;
  billingType?: string;
  status?: string;
}

/**
 * Billing and Analytics Service
 * Handles billing, payments, and analytics for multi-client system
 */
export class BillingAnalyticsService {
  /**
   * Create a billing record
   */
  static async createBillingRecord(params: CreateBillingRecordParams): Promise<any> {
    // Verify client instance exists
    const client = await prisma.clientInstance.findUnique({
      where: { id: params.clientInstanceId },
    });

    if (!client) {
      throw new NotFoundError('Client instance');
    }

    // Create billing record
    const billingRecord = await prisma.billingRecord.create({
      data: {
        client_instance_id: params.clientInstanceId,
        billing_type: params.billingType,
        amount: params.amount,
        description: params.description,
        payment_method: params.paymentMethod,
        status: 'PENDING',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      include: {
        client_instance: {
          select: {
            id: true,
            client_name: true,
            client_code: true,
            contact_email: true,
          },
        },
      },
    });

    logger.info({
      billingId: billingRecord.id,
      clientId: params.clientInstanceId,
      amount: params.amount,
      actorId: params.actorId,
    }, 'Billing record created');

    return billingRecord;
  }

  /**
   * Process payment for a billing record
   */
  static async processPayment(
    billingId: string,
    paymentAmount: number,
    paymentMethod: string,
    transactionId: string,
    actorRole: UserRole,
    actorId: string
  ): Promise<any> {
    // Enforce RBAC: Can actor manage billing?
    RBACService.enforceCanManageBilling(actorRole);

    const billingRecord = await prisma.billingRecord.findUnique({
      where: { id: billingId },
      include: {
        client_instance: true,
      },
    });

    if (!billingRecord) {
      throw new NotFoundError('Billing record not found');
    }

    // Update billing record
    const updatedBilling = await prisma.billingRecord.update({
      where: { id: billingId },
      data: {
        status: paymentAmount >= billingRecord.amount ? 'PAID' : 'PARTIAL',
        paid_amount: paymentAmount,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        paid_at: new Date(),
      },
    });

    // Create payment record
    const payment = await prisma.paymentRecord.create({
      data: {
        billing_record_id: billingId,
        amount: paymentAmount,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        processed_by_id: actorId,
        processed_at: new Date(),
      },
    });

    // Create notification
    await prisma.clientNotification.create({
      data: {
        client_instance_id: billingRecord.client_instance_id,
        notification_type: 'PAYMENT_PROCESSED',
        title: 'Payment Processed',
        message: `Payment of $${paymentAmount.toFixed(2)} has been processed for billing record ${billingId}`,
      },
    });

    logger.info({
      billingId,
      paymentId: payment.id,
      amount: paymentAmount,
      actorId,
    }, 'Payment processed successfully');

    return {
      billing: updatedBilling,
      payment,
    };
  }

  /**
   * Get billing summary for a client
   */
  static async getClientBillingSummary(
    clientInstanceId: string,
    actorRole: UserRole
  ): Promise<any> {
    // Enforce RBAC: Can actor view client data?
    RBACService.enforceCanViewClientData(actorRole);

    const client = await prisma.clientInstance.findUnique({
      where: { id: clientInstanceId },
    });

    if (!client) {
      throw new NotFoundError('Client instance');
    }

    // Get billing records
    const billingRecords = await prisma.billingRecord.findMany({
      where: { client_instance_id: clientInstanceId },
      include: {
        payment_records: {
          orderBy: { processed_at: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Calculate summary
    const totalBilled = billingRecords.reduce((sum, record) => sum + record.amount, 0);
    const totalPaid = billingRecords.reduce((sum, record) => sum + (record.paid_amount || 0), 0);
    const totalOutstanding = totalBilled - totalPaid;
    const overdueRecords = billingRecords.filter(record => 
      record.status !== 'PAID' && 
      record.due_date && 
      record.due_date < new Date()
    );

    return {
      client,
      summary: {
        totalBilled,
        totalPaid,
        totalOutstanding,
        overdueCount: overdueRecords.length,
        overdueAmount: overdueRecords.reduce((sum, record) => sum + record.amount, 0),
      },
      billingRecords,
      recentPayments: billingRecords.flatMap(record => record.payment_records).slice(0, 10),
    };
  }

  /**
   * Get master admin analytics dashboard
   */
  static async getMasterAnalytics(
    filters: AnalyticsFilters,
    actorRole: UserRole
  ): Promise<any> {
    // Enforce RBAC: Can actor view client data?
    RBACService.enforceCanViewClientData(actorRole);

    const whereClause: any = {};

    // Apply filters
    if (filters.clientId) {
      whereClause.client_instance_id = filters.clientId;
    }

    if (filters.billingType) {
      whereClause.billing_type = filters.billingType;
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.dateRange) {
      whereClause.created_at = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    // Get billing records
    const billingRecords = await prisma.billingRecord.findMany({
      where: whereClause,
      include: {
        client_instance: {
          select: {
            id: true,
            client_name: true,
            client_code: true,
            contact_email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Get client statistics
    const totalClients = await prisma.clientInstance.count();
    const activeClients = await prisma.clientInstance.count({
      where: { status: 'ACTIVE' },
    });
    const trialClients = await prisma.clientInstance.count({
      where: { status: 'TRIAL' },
    });

    // Get license statistics
    const totalLicenses = await prisma.enhancedLicenseKey.count();
    const activeLicenses = await prisma.enhancedLicenseKey.count({
      where: { status: 'ACTIVE' },
    });

    // Get credit statistics
    const creditPurchases = await prisma.creditPurchase.findMany();
    const totalCreditsSold = creditPurchases.reduce((sum, purchase) => sum + purchase.credits_purchased, 0);
    const totalRevenue = creditPurchases.reduce((sum, purchase) => sum + purchase.total_cost, 0);

    // Calculate billing statistics
    const totalBilled = billingRecords.reduce((sum, record) => sum + record.amount, 0);
    const totalPaid = billingRecords.reduce((sum, record) => sum + (record.paid_amount || 0), 0);
    const totalOutstanding = totalBilled - totalPaid;

    // Get billing by type
    const billingByType = billingRecords.reduce((acc, record) => {
      acc[record.billing_type] = (acc[record.billing_type] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);

    // Get billing by status
    const billingByStatus = billingRecords.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);

    // Get monthly revenue (last 12 months)
    const monthlyRevenue = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthlyPurchases = await prisma.creditPurchase.findMany({
        where: {
          created_at: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      const monthlyTotal = monthlyPurchases.reduce((sum, purchase) => sum + purchase.total_cost, 0);
      monthlyRevenue.push({
        month: startOfMonth.toISOString().slice(0, 7),
        revenue: monthlyTotal,
        purchases: monthlyPurchases.length,
      });
    }

    return {
      overview: {
        totalClients,
        activeClients,
        trialClients,
        totalLicenses,
        activeLicenses,
        totalCreditsSold,
        totalRevenue,
      },
      billing: {
        totalBilled,
        totalPaid,
        totalOutstanding,
        billingByType,
        billingByStatus,
        monthlyRevenue,
      },
      recentBilling: billingRecords.slice(0, 20),
      topClients: await this.getTopClientsByRevenue(),
    };
  }

  /**
   * Get top clients by revenue
   */
  private static async getTopClientsByRevenue(): Promise<any[]> {
    const clients = await prisma.clientInstance.findMany({
      include: {
        credit_purchases: true,
      },
    });

    const clientsWithRevenue = clients.map(client => {
      const totalRevenue = client.credit_purchases.reduce((sum, purchase) => sum + purchase.total_cost, 0);
      return {
        clientId: client.id,
        clientName: client.client_name,
        clientCode: client.client_code,
        totalRevenue,
        purchaseCount: client.credit_purchases.length,
      };
    });

    return clientsWithRevenue
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
  }

  /**
   * Get payment methods analytics
   */
  static async getPaymentMethodsAnalytics(actorRole: UserRole): Promise<any> {
    // Enforce RBAC: Can actor view client data?
    RBACService.enforceCanViewClientData(actorRole);

    const payments = await prisma.paymentRecord.findMany({
      include: {
        billing_record: {
          include: {
            client_instance: {
              select: {
                client_name: true,
                client_code: true,
              },
            },
          },
        },
      },
      orderBy: { processed_at: 'desc' },
    });

    // Group by payment method
    const paymentMethods = payments.reduce((acc, payment) => {
      const method = payment.payment_method;
      if (!acc[method]) {
        acc[method] = {
          method,
          count: 0,
          totalAmount: 0,
          averageAmount: 0,
        };
      }
      acc[method].count++;
      acc[method].totalAmount += payment.amount;
      acc[method].averageAmount = acc[method].totalAmount / acc[method].count;
      return acc;
    }, {} as Record<string, any>);

    return {
      paymentMethods: Object.values(paymentMethods),
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
      recentPayments: payments.slice(0, 20),
    };
  }

  /**
   * Generate billing report
   */
  static async generateBillingReport(
    filters: AnalyticsFilters,
    actorRole: UserRole
  ): Promise<any> {
    // Enforce RBAC: Can actor view client data?
    RBACService.enforceCanViewClientData(actorRole);

    const whereClause: any = {};

    if (filters.dateRange) {
      whereClause.created_at = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    const billingRecords = await prisma.billingRecord.findMany({
      where: whereClause,
      include: {
        client_instance: {
          select: {
            client_name: true,
            client_code: true,
            contact_email: true,
          },
        },
        payment_records: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Calculate report data
    const reportData = billingRecords.map(record => ({
      billingId: record.id,
      clientName: record.client_instance.client_name,
      clientCode: record.client_instance.client_code,
      clientEmail: record.client_instance.contact_email,
      billingType: record.billing_type,
      amount: record.amount,
      paidAmount: record.paid_amount || 0,
      outstandingAmount: record.amount - (record.paid_amount || 0),
      status: record.status,
      createdDate: record.created_at,
      dueDate: record.due_date,
      paymentCount: record.payment_records.length,
    }));

    const summary = {
      totalRecords: reportData.length,
      totalBilled: reportData.reduce((sum, record) => sum + record.amount, 0),
      totalPaid: reportData.reduce((sum, record) => sum + record.paidAmount, 0),
      totalOutstanding: reportData.reduce((sum, record) => sum + record.outstandingAmount, 0),
      byStatus: reportData.reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return {
      summary,
      data: reportData,
      generatedAt: new Date(),
      filters,
    };
  }
}
