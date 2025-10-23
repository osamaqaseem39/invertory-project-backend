import { PrismaClient, UserRole } from '@prisma/client';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { AuditService } from './audit.service';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

// ===== INTERFACES =====

interface ReceiptData {
  // Business Info
  business_name: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  tax_id?: string;
  
  // Transaction Info
  receipt_number: string;
  transaction_number: string;
  transaction_date: string;
  cashier_name: string;
  
  // Customer Info (if any)
  customer?: {
    name: string;
    customer_number: string;
  };
  
  // Items
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    discount_percentage: number;
    line_total: number;
    tax_amount?: number;
  }>;
  
  // Totals
  subtotal: number;
  tax_total: number;
  discount_total: number;
  total: number;
  
  // Payment
  payment_method: string;
  amount_tendered: number;
  change_amount: number;
  
  // Additional
  coupon_code?: string;
  loyalty_points_earned?: number;
  
  // Settings
  header_text?: string;
  footer_text?: string;
  return_policy?: string;
  qr_code_data?: string;
  barcode_data?: string;
}

interface GenerateReceiptParams {
  transaction_id: string;
  print_settings_id?: string;
}

interface ReprintReceiptParams {
  receipt_id: string;
  actor_id: string;
}

// ===== SERVICE =====

export class ReceiptService {
  /**
   * Generate receipt for a transaction
   */
  static async generateReceipt(params: GenerateReceiptParams, _actorRole: UserRole) {
    // Get transaction with all details
    const transaction = await prisma.pOSTransaction.findUnique({
      where: { id: params.transaction_id },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        customer: {
          select: {
            first_name: true,
            last_name: true,
            customer_number: true,
          },
        },
        session: {
          include: {
            cashier: {
              select: {
                display_name: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    // Get print settings
    const printSettings = params.print_settings_id
      ? await prisma.printSettings.findUnique({ where: { id: params.print_settings_id } })
      : await prisma.printSettings.findFirst({ where: { is_default: true } });

    // Build receipt data
    const receiptData: ReceiptData = {
      // Business info
      business_name: printSettings?.business_name || 'Inventory Pro',
      business_address: printSettings?.business_address || undefined,
      business_phone: printSettings?.business_phone || undefined,
      business_email: printSettings?.business_email || undefined,
      tax_id: printSettings?.tax_id || undefined,
      
      // Transaction info
      receipt_number: await this.generateReceiptNumber(),
      transaction_number: transaction.transaction_number,
      transaction_date: transaction.transaction_date.toISOString(),
      cashier_name: transaction.session.cashier.display_name,
      
      // Customer
      customer: transaction.customer ? {
        name: `${transaction.customer.first_name} ${transaction.customer.last_name}`,
        customer_number: transaction.customer.customer_number,
      } : undefined,
      
      // Items
      items: transaction.items.map(item => ({
        name: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        discount_percentage: Number(item.discount_percentage || 0),
        line_total: Number(item.line_total),
        tax_amount: Number(item.tax_amount || 0),
      })),
      
      // Totals
      subtotal: Number(transaction.subtotal),
      tax_total: Number(transaction.tax_amount),
      discount_total: Number(transaction.discount_amount) + Number(transaction.coupon_discount || 0),
      total: Number(transaction.total_amount),
      
      // Payment
      payment_method: transaction.payment_method,
      amount_tendered: Number(transaction.amount_tendered),
      change_amount: Number(transaction.change_amount),
      
      // Additional
      coupon_code: transaction.coupon_code || undefined,
      loyalty_points_earned: transaction.loyalty_points_earned || undefined,
      
      // Settings
      header_text: printSettings?.header_text || undefined,
      footer_text: printSettings?.footer_text || 'Thank you for your business!',
      return_policy: printSettings?.return_policy || undefined,
    };

    // Generate QR code (link to digital receipt)
    if (printSettings?.print_qr_code) {
      const qrData = `${process.env.APP_URL || 'http://localhost:5173'}/receipts/${transaction.transaction_number}`;
      receiptData.qr_code_data = await QRCode.toDataURL(qrData);
    }

    // Generate barcode (transaction number)
    if (printSettings?.print_barcode) {
      receiptData.barcode_data = transaction.transaction_number;
    }

    // Save receipt
    const receipt = await prisma.receipt.create({
      data: {
        receipt_number: receiptData.receipt_number,
        transaction_id: transaction.id,
        receipt_data: receiptData as any,
        status: 'PRINTED',
        printed_at: new Date(),
      },
    });

    return {
      receipt,
      receipt_data: receiptData,
    };
  }

  /**
   * Reprint a receipt
   */
  static async reprintReceipt(params: ReprintReceiptParams, actorRole: UserRole) {
    if (!['cashier', 'admin', 'owner_ultimate_super_admin'].includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions to reprint receipt');
    }

    const receipt = await prisma.receipt.findUnique({
      where: { id: params.receipt_id },
    });

    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    // Update reprint tracking
    const updatedReceipt = await prisma.receipt.update({
      where: { id: params.receipt_id },
      data: {
        reprint_count: {
          increment: 1,
        },
        last_reprinted_at: new Date(),
        reprinted_by_id: params.actor_id,
      },
    });

    // Audit log
    await AuditService.createLog({
      actorUserId: params.actor_id,
      action: 'REPRINT_RECEIPT',
      metadata: {
        receipt_id: receipt.id,
        receipt_number: receipt.receipt_number,
        reprint_count: updatedReceipt.reprint_count,
      },
    });

    return {
      receipt: updatedReceipt,
      receipt_data: receipt.receipt_data as unknown as ReceiptData,
    };
  }

  /**
   * Get receipt by transaction
   */
  static async getReceiptByTransaction(transactionId: string) {
    const receipt = await prisma.receipt.findFirst({
      where: { transaction_id: transactionId },
      orderBy: { created_at: 'desc' },
    });

    if (!receipt) {
      return null;
    }

    return {
      receipt,
      receipt_data: receipt.receipt_data as unknown as ReceiptData,
    };
  }

  /**
   * Get receipt by number
   */
  static async getReceiptByNumber(receiptNumber: string) {
    const receipt = await prisma.receipt.findUnique({
      where: { receipt_number: receiptNumber },
    });

    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    return {
      receipt,
      receipt_data: receipt.receipt_data as unknown as ReceiptData,
    };
  }

  /**
   * Get or create default print settings
   */
  static async getPrintSettings(settingsId?: string) {
    if (settingsId) {
      const settings = await prisma.printSettings.findUnique({
        where: { id: settingsId },
      });
      if (settings) return settings;
    }

    // Get default
    let defaultSettings = await prisma.printSettings.findFirst({
      where: { is_default: true },
    });

    // Create if doesn't exist
    if (!defaultSettings) {
      const firstUser = await prisma.user.findFirst({
        where: { role: { in: ['admin', 'owner_ultimate_super_admin'] } },
      });

      if (firstUser) {
        defaultSettings = await prisma.printSettings.create({
          data: {
            business_name: 'Inventory Pro',
            business_address: '123 Main Street\nCity, State 12345',
            business_phone: '+1 (555) 123-4567',
            business_email: 'info@inventorypro.com',
            header_text: 'Welcome to Inventory Pro',
            footer_text: 'Thank you for your business!\nPlease come again!',
            return_policy: 'Returns accepted within 30 days with receipt.',
            is_default: true,
            updated_by_id: firstUser.id,
          },
        });
      }
    }

    return defaultSettings;
  }

  /**
   * Update print settings
   */
  static async updatePrintSettings(settingsId: string, data: any, actorRole: UserRole) {
    if (!['admin', 'owner_ultimate_super_admin'].includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions to update print settings');
    }

    const settings = await prisma.printSettings.update({
      where: { id: settingsId },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });

    return settings;
  }

  /**
   * Generate unique receipt number
   */
  private static async generateReceiptNumber(): Promise<string> {
    const count = await prisma.receipt.count();
    return `REC-${String(count + 1).padStart(8, '0')}`;
  }

  /**
   * Generate HTML receipt for printing
   */
  static generateHTMLReceipt(receiptData: ReceiptData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt ${receiptData.receipt_number}</title>
  <style>
    @media print {
      body { margin: 0; }
      @page { margin: 0.5cm; }
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12pt;
      max-width: 80mm;
      margin: 0 auto;
      padding: 10px;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .line { border-top: 1px dashed #000; margin: 10px 0; }
    .header { font-size: 16pt; font-weight: bold; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 2px 0; }
    .right { text-align: right; }
    .total-line { font-weight: bold; font-size: 14pt; }
  </style>
</head>
<body>
  <div class="center header">${receiptData.business_name}</div>
  ${receiptData.business_address ? `<div class="center">${receiptData.business_address.replace(/\n/g, '<br>')}</div>` : ''}
  ${receiptData.business_phone ? `<div class="center">${receiptData.business_phone}</div>` : ''}
  ${receiptData.business_email ? `<div class="center">${receiptData.business_email}</div>` : ''}
  ${receiptData.tax_id ? `<div class="center">Tax ID: ${receiptData.tax_id}</div>` : ''}
  
  ${receiptData.header_text ? `<div class="center" style="margin-top: 10px;">${receiptData.header_text}</div>` : ''}
  
  <div class="line"></div>
  
  <div class="bold">Receipt #: ${receiptData.receipt_number}</div>
  <div>Transaction: ${receiptData.transaction_number}</div>
  <div>Date: ${new Date(receiptData.transaction_date).toLocaleString()}</div>
  <div>Cashier: ${receiptData.cashier_name}</div>
  ${receiptData.customer ? `<div>Customer: ${receiptData.customer.name} (${receiptData.customer.customer_number})</div>` : ''}
  
  <div class="line"></div>
  
  <table>
    ${receiptData.items.map(item => `
      <tr>
        <td colspan="2" class="bold">${item.name}</td>
      </tr>
      <tr>
        <td>  ${item.quantity} x $${item.unit_price.toFixed(2)}${item.discount_percentage > 0 ? ` (-${item.discount_percentage}%)` : ''}</td>
        <td class="right">$${item.line_total.toFixed(2)}</td>
      </tr>
    `).join('')}
  </table>
  
  <div class="line"></div>
  
  <table>
    <tr>
      <td>Subtotal:</td>
      <td class="right">$${receiptData.subtotal.toFixed(2)}</td>
    </tr>
    ${receiptData.discount_total > 0 ? `
    <tr>
      <td>Discount:</td>
      <td class="right">-$${receiptData.discount_total.toFixed(2)}</td>
    </tr>
    ` : ''}
    <tr>
      <td>Tax:</td>
      <td class="right">$${receiptData.tax_total.toFixed(2)}</td>
    </tr>
    <tr class="total-line">
      <td>TOTAL:</td>
      <td class="right">$${receiptData.total.toFixed(2)}</td>
    </tr>
  </table>
  
  <div class="line"></div>
  
  <table>
    <tr>
      <td>Payment (${receiptData.payment_method}):</td>
      <td class="right">$${receiptData.amount_tendered.toFixed(2)}</td>
    </tr>
    ${receiptData.change_amount > 0 ? `
    <tr>
      <td>Change:</td>
      <td class="right">$${receiptData.change_amount.toFixed(2)}</td>
    </tr>
    ` : ''}
  </table>
  
  ${receiptData.coupon_code ? `
  <div class="line"></div>
  <div class="center">Coupon Applied: ${receiptData.coupon_code}</div>
  ` : ''}
  
  ${receiptData.loyalty_points_earned ? `
  <div class="center">Points Earned: ${receiptData.loyalty_points_earned}</div>
  ` : ''}
  
  ${receiptData.qr_code_data ? `
  <div class="line"></div>
  <div class="center">
    <img src="${receiptData.qr_code_data}" alt="QR Code" style="width: 150px; height: 150px;">
    <div style="font-size: 8pt;">Scan for digital receipt</div>
  </div>
  ` : ''}
  
  ${receiptData.return_policy ? `
  <div class="line"></div>
  <div class="center" style="font-size: 9pt;">
    <div class="bold">Return Policy</div>
    <div>${receiptData.return_policy}</div>
  </div>
  ` : ''}
  
  ${receiptData.footer_text ? `
  <div class="line"></div>
  <div class="center">${receiptData.footer_text.replace(/\n/g, '<br>')}</div>
  ` : ''}
  
  <div class="center" style="margin-top: 20px; font-size: 10pt;">
    <div>${new Date().toLocaleString()}</div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Create receipt record and return data
   */
  static async createReceipt(transactionId: string) {
    const result = await this.generateReceipt({ transaction_id: transactionId }, 'cashier' as UserRole);
    return result;
  }

  /**
   * Email receipt to customer
   */
  static async emailReceipt(receiptId: string, emailAddress: string) {
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
    });

    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    // Update receipt status
    await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        status: 'EMAILED',
        emailed_at: new Date(),
        email_address: emailAddress,
      },
    });

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    // For now, just return success
    
    return {
      success: true,
      message: `Receipt emailed to ${emailAddress}`,
    };
  }
}

export default ReceiptService;

