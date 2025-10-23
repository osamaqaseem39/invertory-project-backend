import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

export interface BrandedReceiptData {
  // Company Info
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  taxId?: string;
  logo?: string; // base64
  logoPosition: 'LEFT' | 'CENTER' | 'RIGHT';
  
  // Header/Footer
  headerText?: string;
  footerText?: string;
  
  // Transaction Data
  receiptNumber: string;
  transactionDate: string;
  cashier: string;
  customer?: string;
  
  // Items
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
    sku?: string;
  }>;
  
  // Totals
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  
  // Payment
  paymentMethod: string;
  amountTendered?: number;
  change?: number;
  
  // QR Code
  qrCodeData?: string;
}

export class ReceiptBrandingService {
  /**
   * Generate branded thermal receipt (text-based)
   */
  static async generateThermalReceipt(
    receiptData: BrandedReceiptData,
    paperWidth: number = 42 // characters (80mm = 42 chars)
  ): Promise<string> {
    let receipt = '';

    // Header
    receipt += this.centerText('', paperWidth) + '\n';
    
    // Logo (if available, represented as ASCII art or skip for text)
    if (receiptData.logo) {
      receipt += this.centerText('[LOGO]', paperWidth) + '\n\n';
    }

    // Company Name (Bold)
    receipt += this.centerText(receiptData.companyName.toUpperCase(), paperWidth) + '\n';
    
    // Tagline/Header Text
    if (receiptData.headerText) {
      receipt += this.centerText(receiptData.headerText, paperWidth) + '\n';
    }
    
    receipt += '\n';

    // Company Info
    if (receiptData.companyAddress) {
      receipt += this.centerText(receiptData.companyAddress, paperWidth) + '\n';
    }
    if (receiptData.companyPhone) {
      receipt += this.centerText(`Tel: ${receiptData.companyPhone}`, paperWidth) + '\n';
    }
    if (receiptData.companyEmail) {
      receipt += this.centerText(receiptData.companyEmail, paperWidth) + '\n';
    }
    if (receiptData.taxId) {
      receipt += this.centerText(`Tax ID: ${receiptData.taxId}`, paperWidth) + '\n';
    }

    receipt += this.separator('=', paperWidth) + '\n';

    // Transaction Info
    receipt += this.leftRight('Receipt #:', receiptData.receiptNumber, paperWidth) + '\n';
    receipt += this.leftRight('Date:', receiptData.transactionDate, paperWidth) + '\n';
    receipt += this.leftRight('Cashier:', receiptData.cashier, paperWidth) + '\n';
    
    if (receiptData.customer) {
      receipt += this.leftRight('Customer:', receiptData.customer, paperWidth) + '\n';
    }

    receipt += this.separator('=', paperWidth) + '\n';

    // Items
    receipt += this.leftRight('ITEM', 'QTY  PRICE  TOTAL', paperWidth) + '\n';
    receipt += this.separator('-', paperWidth) + '\n';

    for (const item of receiptData.items) {
      // Item name (may wrap)
      const itemName = item.sku ? `${item.name} (${item.sku})` : item.name;
      receipt += this.wrapText(itemName, paperWidth) + '\n';
      
      // Quantity, price, total on next line
      const qtyPrice = `  ${item.quantity} x $${item.price.toFixed(2)}`;
      const total = `$${item.total.toFixed(2)}`;
      receipt += this.leftRight(qtyPrice, total, paperWidth) + '\n';
    }

    receipt += this.separator('-', paperWidth) + '\n';

    // Totals
    receipt += this.leftRight('Subtotal:', `$${receiptData.subtotal.toFixed(2)}`, paperWidth) + '\n';
    
    if (receiptData.discount && receiptData.discount > 0) {
      receipt += this.leftRight('Discount:', `-$${receiptData.discount.toFixed(2)}`, paperWidth) + '\n';
    }
    
    if (receiptData.tax > 0) {
      receipt += this.leftRight('Tax:', `$${receiptData.tax.toFixed(2)}`, paperWidth) + '\n';
    }

    receipt += this.separator('=', paperWidth) + '\n';
    receipt += this.leftRight('TOTAL:', `$${receiptData.total.toFixed(2)}`, paperWidth, true) + '\n';
    receipt += this.separator('=', paperWidth) + '\n';

    // Payment
    receipt += '\n';
    receipt += this.leftRight('Payment Method:', receiptData.paymentMethod, paperWidth) + '\n';
    
    if (receiptData.amountTendered) {
      receipt += this.leftRight('Amount Tendered:', `$${receiptData.amountTendered.toFixed(2)}`, paperWidth) + '\n';
    }
    
    if (receiptData.change && receiptData.change > 0) {
      receipt += this.leftRight('Change:', `$${receiptData.change.toFixed(2)}`, paperWidth) + '\n';
    }

    receipt += '\n';
    receipt += this.separator('=', paperWidth) + '\n';

    // Footer Text
    if (receiptData.footerText) {
      receipt += '\n';
      receipt += this.centerText(receiptData.footerText, paperWidth) + '\n';
    }

    // QR Code (represented as [QR CODE] for text receipt)
    if (receiptData.qrCodeData) {
      receipt += '\n';
      receipt += this.centerText('[QR CODE]', paperWidth) + '\n';
      receipt += this.centerText(receiptData.qrCodeData, paperWidth) + '\n';
    }

    receipt += '\n';
    receipt += this.centerText('Thank You!', paperWidth) + '\n';
    receipt += '\n\n\n';

    return receipt;
  }

  /**
   * Generate QR code for receipt
   */
  static async generateReceiptQRCode(data: string): Promise<string> {
    try {
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(data, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('QR code generation failed:', error);
      return '';
    }
  }

  /**
   * Center text
   */
  private static centerText(text: string, width: number): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  /**
   * Left-right aligned text
   */
  private static leftRight(left: string, right: string, width: number, bold: boolean = false): string {
    const spacing = width - left.length - right.length;
    const result = left + ' '.repeat(Math.max(1, spacing)) + right;
    return bold ? result.toUpperCase() : result;
  }

  /**
   * Separator line
   */
  private static separator(char: string, width: number): string {
    return char.repeat(width);
  }

  /**
   * Wrap text to fit width
   */
  private static wrapText(text: string, width: number): string {
    if (text.length <= width) {
      return text;
    }

    const words = text.split(' ');
    let lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).length <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) lines.push(currentLine);

    return lines.join('\n');
  }

  /**
   * Load branding for receipt
   */
  static async getBrandingForReceipt() {
    const profile = await prisma.brandingProfile.findFirst({
      where: { is_active: true },
    });

    if (!profile) {
      // Return default
      return {
        companyName: 'Inventory Pro',
        companyAddress: null,
        companyPhone: null,
        companyEmail: null,
        taxId: null,
        logo: null,
        logoPosition: 'CENTER' as const,
        headerText: null,
        footerText: 'Thank you for your business!',
      };
    }

    return {
      companyName: profile.company_name,
      companyAddress: profile.business_address,
      companyPhone: profile.business_phone,
      companyEmail: profile.business_email,
      taxId: profile.tax_id,
      logo: profile.logo_base64,
      logoPosition: profile.receipt_logo_position as any,
      headerText: profile.receipt_header_text,
      footerText: profile.receipt_footer_text || 'Thank you for your business!',
    };
  }
}





