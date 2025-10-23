import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  
  // Customer
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerTaxId?: string;
  
  // Items
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    sku?: string;
  }>;
  
  // Totals
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  
  // Payment
  paymentTerms?: string;
  notes?: string;
}

export class PDFInvoiceService {
  /**
   * Generate branded PDF invoice
   */
  static async generateInvoice(invoiceData: InvoiceData, outputPath?: string): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        // Load branding
        const branding = await this.loadBranding();

        // Create PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
          },
        });

        const buffers: Buffer[] = [];

        // Collect PDF data
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          
          // Save to file if path provided
          if (outputPath) {
            fs.writeFileSync(outputPath, pdfBuffer);
          }
          
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Build invoice
        await this.buildInvoicePDF(doc, invoiceData, branding);

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Build invoice PDF content
   */
  private static async buildInvoicePDF(
    doc: typeof PDFDocument.prototype,
    data: InvoiceData,
    branding: any
  ) {
    const pageWidth = doc.page.width - 100; // Account for margins
    let yPosition = 80;

    // HEADER
    doc.fontSize(24)
       .fillColor(branding.primary_color)
       .text(branding.company_name, 50, 50, { width: pageWidth / 2 });

    // Logo (if available)
    if (branding.logo_pdf && fs.existsSync(branding.logo_pdf.replace(/^\//, ''))) {
      try {
        doc.image(branding.logo_pdf.replace(/^\//, ''), pageWidth - 150, 50, {
          width: 150,
          height: 60,
          fit: 'contain',
        });
      } catch (e) {
        // Skip logo if error
      }
    }

    yPosition = 130;

    // Company Info (small text)
    doc.fontSize(9)
       .fillColor('#666666');

    if (branding.business_address) {
      doc.text(branding.business_address, 50, yPosition);
      yPosition += 12;
    }

    if (branding.business_phone) {
      doc.text(`Tel: ${branding.business_phone}`, 50, yPosition);
      yPosition += 12;
    }

    if (branding.business_email) {
      doc.text(`Email: ${branding.business_email}`, 50, yPosition);
      yPosition += 12;
    }

    if (branding.tax_id) {
      doc.text(`Tax ID: ${branding.tax_id}`, 50, yPosition);
      yPosition += 12;
    }

    yPosition += 20;

    // INVOICE TITLE
    doc.fontSize(28)
       .fillColor('#000000')
       .text('INVOICE', 50, yPosition, { align: 'right' });

    yPosition += 40;

    // Invoice Info Box
    doc.fontSize(10)
       .fillColor('#000000');

    const infoBoxX = pageWidth - 150;
    doc.rect(infoBoxX, yPosition, 150, 80)
       .fillAndStroke(branding.primary_color + '10', branding.primary_color);

    doc.fillColor(branding.primary_color)
       .text('Invoice #:', infoBoxX + 10, yPosition + 10);
    doc.fillColor('#000000')
       .text(data.invoiceNumber, infoBoxX + 10, yPosition + 25);

    doc.fillColor(branding.primary_color)
       .text('Date:', infoBoxX + 10, yPosition + 45);
    doc.fillColor('#000000')
       .text(data.invoiceDate, infoBoxX + 10, yPosition + 60);

    // BILL TO
    doc.fontSize(12)
       .fillColor(branding.primary_color)
       .text('BILL TO:', 50, yPosition);

    yPosition += 20;

    doc.fontSize(10)
       .fillColor('#000000')
       .text(data.customerName, 50, yPosition, { width: 250 });

    yPosition += 15;

    if (data.customerAddress) {
      doc.text(data.customerAddress, 50, yPosition, { width: 250 });
      yPosition += 15;
    }

    if (data.customerPhone) {
      doc.text(`Tel: ${data.customerPhone}`, 50, yPosition);
      yPosition += 15;
    }

    if (data.customerEmail) {
      doc.text(data.customerEmail, 50, yPosition);
      yPosition += 15;
    }

    yPosition += 40;

    // TABLE HEADER
    const tableTop = yPosition;
    const col1X = 50;
    const col2X = 250;
    const col3X = 350;
    const col4X = 420;

    doc.rect(col1X, tableTop, pageWidth, 25)
       .fill(branding.primary_color);

    doc.fontSize(10)
       .fillColor('#FFFFFF')
       .text('DESCRIPTION', col1X + 5, tableTop + 8)
       .text('QTY', col2X + 5, tableTop + 8)
       .text('PRICE', col3X + 5, tableTop + 8)
       .text('TOTAL', col4X + 5, tableTop + 8);

    yPosition = tableTop + 30;

    // TABLE ROWS
    doc.fillColor('#000000');

    for (const item of data.items) {
      // Alternate row background
      if (data.items.indexOf(item) % 2 === 0) {
        doc.rect(col1X, yPosition - 5, pageWidth, 20).fill('#F9FAFB');
      }

      doc.fillColor('#000000')
         .fontSize(9)
         .text(item.description, col1X + 5, yPosition, { width: 190 })
         .text(item.quantity.toString(), col2X + 5, yPosition)
         .text(`$${item.unitPrice.toFixed(2)}`, col3X + 5, yPosition)
         .text(`$${item.total.toFixed(2)}`, col4X + 5, yPosition);

      yPosition += 25;
    }

    yPosition += 10;

    // TOTALS SECTION
    const totalsX = 400;

    doc.fontSize(10);

    doc.text('Subtotal:', totalsX, yPosition);
    doc.text(`$${data.subtotal.toFixed(2)}`, col4X + 5, yPosition);
    yPosition += 20;

    if (data.discount && data.discount > 0) {
      doc.text('Discount:', totalsX, yPosition);
      doc.text(`-$${data.discount.toFixed(2)}`, col4X + 5, yPosition);
      yPosition += 20;
    }

    doc.text('Tax:', totalsX, yPosition);
    doc.text(`$${data.tax.toFixed(2)}`, col4X + 5, yPosition);
    yPosition += 20;

    // TOTAL (highlighted)
    doc.rect(totalsX - 5, yPosition - 5, 145, 30)
       .fill(branding.primary_color);

    doc.fontSize(14)
       .fillColor('#FFFFFF')
       .text('TOTAL:', totalsX, yPosition + 5);
    doc.text(`$${data.total.toFixed(2)}`, col4X + 5, yPosition + 5);

    yPosition += 50;

    // PAYMENT TERMS
    if (data.paymentTerms) {
      doc.fontSize(9)
         .fillColor('#666666')
         .text(`Payment Terms: ${data.paymentTerms}`, 50, yPosition);
      yPosition += 20;
    }

    // NOTES
    if (data.notes) {
      doc.fontSize(9)
         .fillColor('#666666')
         .text('Notes:', 50, yPosition);
      yPosition += 15;
      doc.text(data.notes, 50, yPosition, { width: pageWidth });
      yPosition += 30;
    }

    // WATERMARK (if enabled)
    if (branding.show_watermark && branding.invoice_watermark) {
      doc.fontSize(80)
         .fillColor('#CCCCCC', branding.watermark_opacity / 100)
         .text(branding.invoice_watermark, 0, 400, {
           align: 'center',
           width: doc.page.width,
         });
    }

    // FOOTER
    const footerY = doc.page.height - 80;

    doc.rect(50, footerY, pageWidth, 1).fill('#CCCCCC');

    doc.fontSize(8)
       .fillColor('#666666')
       .text(
         branding.footer_text || `${branding.company_name} - Invoice`,
         50,
         footerY + 10,
         { width: pageWidth, align: 'center' }
       );
  }

  /**
   * Load branding profile
   */
  private static async loadBranding() {
    const profile = await prisma.brandingProfile.findFirst({
      where: { is_active: true },
    });

    if (!profile) {
      return {
        company_name: 'Inventory Pro',
        business_address: null,
        business_phone: null,
        business_email: null,
        tax_id: null,
        logo_pdf: null,
        primary_color: '#3B82F6',
        footer_text: 'Thank you for your business',
        show_watermark: false,
        invoice_watermark: null,
        watermark_opacity: 10,
      };
    }

    return {
      company_name: profile.company_name,
      business_address: profile.business_address,
      business_phone: profile.business_phone,
      business_email: profile.business_email,
      tax_id: profile.tax_id,
      logo_pdf: profile.logo_pdf,
      primary_color: profile.primary_color,
      footer_text: profile.receipt_footer_text,
      show_watermark: profile.show_watermark,
      invoice_watermark: profile.invoice_watermark,
      watermark_opacity: profile.watermark_opacity,
    };
  }
}

