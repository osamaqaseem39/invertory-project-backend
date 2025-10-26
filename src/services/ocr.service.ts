import { PrismaClient } from '@prisma/client';
import Tesseract from 'tesseract.js';
import fs from 'fs/promises';
import sharp from 'sharp';

const prisma = new PrismaClient();

export interface OCRUploadParams {
  file: Express.Multer.File;
  sourceType: 'RECEIPT' | 'INVOICE' | 'PURCHASE_ORDER' | 'PRICE_LIST';
  uploadedById: string;
  sourceReference?: string;
}

export interface ProductExtractionResult {
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  lineNumber: number;
  rawText: string;
  confidenceScore: number;
}

export interface OCRProcessingResult {
  scanId: string;
  status: 'COMPLETED' | 'FAILED';
  productsExtracted: number;
  confidenceScore: number;
  processingTime: number;
  errorMessage?: string;
}

export class OCRService {
  /**
   * Upload and create OCR scan record
   */
  static async uploadDocument(params: OCRUploadParams) {
    const { file, sourceType, uploadedById, sourceReference } = params;

    // Handle both disk and memory storage
    const filePath = file.path || (file.buffer ? 'memory://' + file.filename : 'unknown');
    const fileBuffer = file.buffer;

    // Create scan record
    const scan = await prisma.oCRScan.create({
      data: {
        file_name: file.filename,
        file_path: filePath,
        file_type: file.mimetype,
        file_size: file.size,
        source_type: sourceType,
        source_reference: sourceReference,
        status: 'PENDING',
        uploaded_by_id: uploadedById,
        products_count: 0,
      },
    });

    // Store buffer in memory if using memory storage
    if (fileBuffer) {
      (scan as any).fileBuffer = fileBuffer;
    }

    return scan;
  }

  /**
   * Process OCR scan - extract text and products
   */
  static async processScan(scanId: string): Promise<OCRProcessingResult> {
    const startTime = Date.now();

    try {
      const scan = await prisma.oCRScan.findUnique({
        where: { id: scanId },
      });

      if (!scan) {
        throw new Error('Scan not found');
      }

      // Update status to PROCESSING
      await prisma.oCRScan.update({
        where: { id: scanId },
        data: { status: 'PROCESSING' },
      });

      // Extract text from file
      let rawText: string;
      let confidence: number;

      // Check if we have a buffer (memory storage) or need to read from disk
      const scanWithBuffer = scan as any;
      const fileBuffer = scanWithBuffer.fileBuffer;

      if (scan.file_type.includes('pdf')) {
        // Extract from PDF
        const result = fileBuffer 
          ? await this.extractTextFromPDFBuffer(fileBuffer)
          : await this.extractTextFromPDF(scan.file_path);
        rawText = result.text;
        confidence = 85; // PDF text extraction is generally reliable
      } else {
        // Extract from image using OCR
        const result = fileBuffer 
          ? await this.extractTextFromImageBuffer(fileBuffer)
          : await this.extractTextFromImage(scan.file_path);
        rawText = result.text;
        confidence = result.confidence;
      }

      // Parse products from text
      const products = await this.extractProducts(rawText, scanId);

      // Extract document metadata
      const metadata = this.extractMetadata(rawText);

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      // Update scan with results
      await prisma.oCRScan.update({
        where: { id: scanId },
        data: {
          status: 'COMPLETED',
          raw_text: rawText,
          confidence_score: confidence,
          processing_time: processingTime,
          products_count: products.length,
          vendor_name: metadata.vendorName,
          document_date: metadata.documentDate,
          document_total: metadata.documentTotal,
          currency: metadata.currency,
        },
      });

      // Create OCR product records
      await this.createProductRecords(products, scanId);

      return {
        scanId,
        status: 'COMPLETED',
        productsExtracted: products.length,
        confidenceScore: confidence,
        processingTime,
      };
    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      // Update scan with error
      await prisma.oCRScan.update({
        where: { id: scanId },
        data: {
          status: 'FAILED',
          error_message: error.message,
          processing_time: processingTime,
        },
      });

      return {
        scanId,
        status: 'FAILED',
        productsExtracted: 0,
        confidenceScore: 0,
        processingTime,
        errorMessage: error.message,
      };
    }
  }

  /**
   * Extract text from PDF using pdfjs-dist
   */
  private static async extractTextFromPDF(filePath: string): Promise<{ text: string }> {
    const dataBuffer = await fs.readFile(filePath);
    
    // Use dynamic import to load pdfjs-dist legacy build
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // Convert Buffer to Uint8Array for pdfjs-dist compatibility
    const uint8Array = new Uint8Array(dataBuffer);
    
    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return { text: fullText.trim() };
  }

  /**
   * Extract text from image using Tesseract OCR
   */
  private static async extractTextFromImage(filePath: string): Promise<{ text: string; confidence: number }> {
    // Optimize image for OCR
    const optimizedPath = filePath + '_optimized.jpg';
    await sharp(filePath)
      .grayscale()
      .normalize()
      .sharpen()
      .jpeg({ quality: 90 })
      .toFile(optimizedPath);

    // Perform OCR
    const result = await Tesseract.recognize(optimizedPath, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    // Clean up optimized file
    await fs.unlink(optimizedPath).catch(() => {});

    return {
      text: result.data.text,
      confidence: result.data.confidence,
    };
  }

  /**
   * Extract text from PDF buffer (for memory storage)
   */
  private static async extractTextFromPDFBuffer(buffer: Buffer): Promise<{ text: string }> {
    // Use dynamic import to load pdfjs-dist legacy build
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // Convert Buffer to Uint8Array for pdfjs-dist compatibility
    const uint8Array = new Uint8Array(buffer);
    
    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return { text: fullText.trim() };
  }

  /**
   * Extract text from image buffer using Tesseract OCR (for memory storage)
   */
  private static async extractTextFromImageBuffer(buffer: Buffer): Promise<{ text: string; confidence: number }> {
    // Optimize image for OCR using buffer
    const optimizedBuffer = await sharp(buffer)
      .grayscale()
      .normalize()
      .sharpen()
      .jpeg({ quality: 90 })
      .toBuffer();

    // Perform OCR on buffer
    const result = await Tesseract.recognize(optimizedBuffer, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    return {
      text: result.data.text,
      confidence: result.data.confidence,
    };
  }

  /**
   * Extract product information from OCR text
   */
  private static async extractProducts(text: string, _scanId: string): Promise<ProductExtractionResult[]> {
    const products: ProductExtractionResult[] = [];
    const lines = text.split('\n').filter((line) => line.trim().length > 0);

    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;

      // Skip header/footer lines
      if (this.isHeaderOrFooter(line)) continue;

      // Try to extract product information
      const product = this.parseProductLine(line, lineNumber);

      if (product) {
        products.push(product);
      }
    }

    // Match products with existing inventory
    await this.matchProductsWithInventory(products);

    return products;
  }

  /**
   * Check if line is likely a header or footer
   */
  private static isHeaderOrFooter(line: string): boolean {
    const lowerLine = line.toLowerCase();
    const headerFooterKeywords = [
      'invoice', 'receipt', 'tax', 'subtotal', 'total', 'thank you',
      'visit us', 'www.', 'page', 'date', 'time', 'cashier',
      'transaction', 'store', 'address', 'phone', 'email',
    ];

    return headerFooterKeywords.some((keyword) => lowerLine.includes(keyword));
  }

  /**
   * Parse product information from a single line
   */
  private static parseProductLine(line: string, lineNumber: number): ProductExtractionResult | null {
    // Price pattern: $XX.XX, XX.XX, or similar
    const priceRegex = /\$?\s*(\d+[.,]\d{2})/g;
    const prices = Array.from(line.matchAll(priceRegex)).map((m) => parseFloat(m[1].replace(',', '.')));

    // Quantity pattern: digits at start or after 'x'
    const quantityRegex = /^(\d+)\s+|x\s*(\d+)/i;
    const quantityMatch = line.match(quantityRegex);
    const quantity = quantityMatch ? parseInt(quantityMatch[1] || quantityMatch[2]) : undefined;

    // SKU/Barcode pattern: alphanumeric codes
    const skuRegex = /\b([A-Z0-9]{3,}[-_]?[A-Z0-9]{3,})\b/;
    const skuMatch = line.match(skuRegex);
    const sku = skuMatch ? skuMatch[1] : undefined;

    // Barcode pattern: numeric codes (8-13 digits)
    const barcodeRegex = /\b(\d{8,13})\b/;
    const barcodeMatch = line.match(barcodeRegex);
    const barcode = barcodeMatch ? barcodeMatch[1] : undefined;

    // Extract product name (text before first price)
    let productName = line;
    if (prices.length > 0) {
      const priceIndex = line.indexOf(prices[0].toString());
      if (priceIndex > 0) {
        productName = line.substring(0, priceIndex).trim();
      }
    }

    // Clean product name
    productName = productName.replace(/^\d+\s+/, '').replace(/x\s*\d+/i, '').trim();

    // Remove SKU/Barcode from name
    if (sku) productName = productName.replace(sku, '').trim();
    if (barcode) productName = productName.replace(barcode, '').trim();

    // If no valid product name or no prices, skip
    if (productName.length < 3 || prices.length === 0) {
      return null;
    }

    // Determine unit price and total price
    let unitPrice: number | undefined;
    let totalPrice: number | undefined;

    if (prices.length === 1) {
      // Only one price - assume it's the total
      totalPrice = prices[0];
      unitPrice = quantity ? totalPrice / quantity : totalPrice;
    } else if (prices.length >= 2) {
      // Multiple prices - assume first is unit, last is total
      unitPrice = prices[0];
      totalPrice = prices[prices.length - 1];
    }

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore({
      hasName: productName.length >= 3,
      hasPrice: prices.length > 0,
      hasQuantity: !!quantity,
      hasSku: !!sku,
      hasBarcode: !!barcode,
    });

    return {
      name: productName,
      sku,
      barcode,
      quantity,
      unitPrice,
      totalPrice,
      lineNumber,
      rawText: line,
      confidenceScore,
    };
  }

  /**
   * Calculate confidence score based on extracted data
   */
  private static calculateConfidenceScore(params: {
    hasName: boolean;
    hasPrice: boolean;
    hasQuantity: boolean;
    hasSku: boolean;
    hasBarcode: boolean;
  }): number {
    let score = 0;

    if (params.hasName) score += 30;
    if (params.hasPrice) score += 30;
    if (params.hasQuantity) score += 15;
    if (params.hasSku) score += 15;
    if (params.hasBarcode) score += 10;

    return score;
  }

  /**
   * Match extracted products with existing inventory
   */
  private static async matchProductsWithInventory(products: ProductExtractionResult[]): Promise<void> {
    for (const product of products) {
      // Try exact match by SKU or Barcode
      if (product.sku || product.barcode) {
        const existingProduct = await prisma.product.findFirst({
          where: {
            OR: [
              product.sku ? { sku: product.sku } : {},
              product.barcode ? { barcode: product.barcode } : {},
            ],
          },
        });

        if (existingProduct) {
          (product as any).matchedProductId = existingProduct.id;
          (product as any).matchedProductName = existingProduct.name;
          continue;
        }
      }

      // Try fuzzy match by name (simple implementation)
      // In production, use a library like fuzzball.js
      const similarProducts = await prisma.product.findMany({
        where: {
          name: {
            contains: product.name.substring(0, Math.min(10, product.name.length)),
            mode: 'insensitive',
          },
        },
        take: 5,
      });

      if (similarProducts.length > 0) {
        // Use first match as suggestion
        (product as any).matchedProductId = similarProducts[0].id;
        (product as any).matchedProductName = similarProducts[0].name;
        (product as any).isFuzzyMatch = true;
      }
    }
  }

  /**
   * Extract document metadata (vendor, date, total, etc.)
   */
  private static extractMetadata(text: string): {
    vendorName?: string;
    documentDate?: Date;
    documentTotal?: number;
    currency?: string;
  } {
    // Extract vendor name (first line or after "From:")
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    const vendorName = lines[0]?.trim().substring(0, 255);

    // Extract date
    const dateRegex = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/;
    const dateMatch = text.match(dateRegex);
    let documentDate: Date | undefined;
    if (dateMatch) {
      try {
        documentDate = new Date(dateMatch[1]);
      } catch {}
    }

    // Extract total
    const totalRegex = /total[:\s]*\$?\s*(\d+[.,]\d{2})/i;
    const totalMatch = text.match(totalRegex);
    const documentTotal = totalMatch ? parseFloat(totalMatch[1].replace(',', '.')) : undefined;

    // Extract currency
    const hasDollar = text.includes('$') || text.includes('USD');
    const hasEuro = text.includes('€') || text.includes('EUR');
    const hasPound = text.includes('£') || text.includes('GBP');
    const currency = hasDollar ? 'USD' : hasEuro ? 'EUR' : hasPound ? 'GBP' : undefined;

    return {
      vendorName,
      documentDate,
      documentTotal,
      currency,
    };
  }

  /**
   * Create OCR product records in database
   */
  private static async createProductRecords(products: ProductExtractionResult[], scanId: string): Promise<void> {
    for (const product of products) {
      await prisma.oCRProduct.create({
        data: {
          scan_id: scanId,
          raw_text: product.rawText,
          line_number: product.lineNumber,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          quantity: product.quantity,
          unit_price: product.unitPrice,
          total_price: product.totalPrice,
          matched_product_id: (product as any).matchedProductId,
          confidence_score: product.confidenceScore,
          is_reviewed: false,
          is_approved: false,
          is_added_to_inventory: false,
        },
      });
    }
  }

  /**
   * List scans with filters
   */
  static async listScans(filters: {
    userId?: string;
    status?: string;
    sourceType?: string;
    page?: number;
    limit?: number;
  }) {
    const { userId, status, sourceType, page = 1, limit = 20 } = filters;

    const where: any = {};
    if (userId) where.uploaded_by_id = userId;
    if (status) where.status = status;
    if (sourceType) where.source_type = sourceType;

    const [scans, total] = await Promise.all([
      prisma.oCRScan.findMany({
        where,
        include: {
          uploaded_by: {
            select: {
              id: true,
              username: true,
              display_name: true,
            },
          },
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.oCRScan.count({ where }),
    ]);

    return {
      data: scans,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get scan details with products
   */
  static async getScanById(scanId: string) {
    const scan = await prisma.oCRScan.findUnique({
      where: { id: scanId },
      include: {
        uploaded_by: {
          select: {
            id: true,
            username: true,
            display_name: true,
          },
        },
        reviewed_by: {
          select: {
            id: true,
            username: true,
            display_name: true,
          },
        },
        products: {
          include: {
            matched_product: {
              select: {
                id: true,
                name: true,
                sku: true,
                barcode: true,
                price: true,
              },
            },
          },
          orderBy: { line_number: 'asc' },
        },
      },
    });

    return scan;
  }

  /**
   * Mark scan as reviewed
   */
  static async reviewScan(scanId: string, reviewedById: string) {
    return await prisma.oCRScan.update({
      where: { id: scanId },
      data: {
        status: 'REVIEWED',
        reviewed_by_id: reviewedById,
        reviewed_at: new Date(),
      },
    });
  }

  /**
   * Approve OCR product
   */
  static async approveProduct(productId: string) {
    return await prisma.oCRProduct.update({
      where: { id: productId },
      data: {
        is_reviewed: true,
        is_approved: true,
      },
    });
  }

  /**
   * Correct OCR product data
   */
  static async correctProduct(productId: string, corrections: {
    name?: string;
    sku?: string;
    price?: number;
    notes?: string;
  }) {
    return await prisma.oCRProduct.update({
      where: { id: productId },
      data: {
        corrected_name: corrections.name,
        corrected_sku: corrections.sku,
        corrected_price: corrections.price,
        correction_notes: corrections.notes,
        is_reviewed: true,
      },
    });
  }

  /**
   * Add OCR product to inventory
   */
  static async addProductToInventory(productId: string, createdById: string) {
    const ocrProduct = await prisma.oCRProduct.findUnique({
      where: { id: productId },
    });

    if (!ocrProduct) {
      throw new Error('OCR product not found');
    }

    if (ocrProduct.is_added_to_inventory) {
      throw new Error('Product already added to inventory');
    }

    // Use corrected data if available, otherwise use extracted data
    const productName = ocrProduct.corrected_name || ocrProduct.name;
    const productSku = ocrProduct.corrected_sku || ocrProduct.sku || `OCR-${Date.now()}`;
    const productPrice = ocrProduct.corrected_price || ocrProduct.unit_price || 0;

    // Create product in inventory
    const newProduct = await prisma.product.create({
      data: {
        name: productName,
        sku: productSku,
        barcode: ocrProduct.barcode,
        price: productPrice,
        stock_quantity: Math.floor(Number(ocrProduct.quantity || 0)),
        is_active: true,
        is_archived: false,
        created_by_id: createdById,
      },
    });

    // Mark OCR product as added
    await prisma.oCRProduct.update({
      where: { id: productId },
      data: {
        is_added_to_inventory: true,
        matched_product_id: newProduct.id,
      },
    });

    return newProduct;
  }

  /**
   * Bulk add products to inventory
   */
  static async bulkAddProducts(productIds: string[], createdById: string) {
    const results = {
      added: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const productId of productIds) {
      try {
        await this.addProductToInventory(productId, createdById);
        results.added.push(productId);
      } catch (error: any) {
        results.failed.push({ id: productId, error: error.message });
      }
    }

    return results;
  }

  /**
   * Delete scan and all associated products
   */
  static async deleteScan(scanId: string) {
    // Delete products first (cascade should handle this, but being explicit)
    await prisma.oCRProduct.deleteMany({
      where: { scan_id: scanId },
    });

    // Delete scan
    const scan = await prisma.oCRScan.delete({
      where: { id: scanId },
    });

    // Delete file from filesystem
    try {
      await fs.unlink(scan.file_path);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }

    return scan;
  }
}

