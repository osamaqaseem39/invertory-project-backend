import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export interface CreateBrandingParams {
  company_name: string;
  company_name_ar?: string;
  tagline?: string;
  business_address?: string;
  business_phone?: string;
  business_email?: string;
  business_website?: string;
  tax_id?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  success_color?: string;
  warning_color?: string;
  error_color?: string;
  font_family?: string;
  theme_mode?: string;
  receipt_header_text?: string;
  receipt_footer_text?: string;
  receipt_logo_position?: string;
  invoice_template?: string;
  invoice_watermark?: string;
  show_watermark?: boolean;
  created_by_id: string;
}

export class BrandingService {
  /**
   * Get active branding profile
   */
  static async getActiveBranding() {
    let profile = await prisma.brandingProfile.findFirst({
      where: { is_active: true },
      orderBy: { created_at: 'desc' },
    });

    // Return default if none exists
    if (!profile) {
      profile = await this.getDefaultBranding();
    }

    return profile;
  }

  /**
   * Get default branding (fallback)
   */
  static getDefaultBranding(): any {
    return {
      id: 'default',
      company_name: 'Inventory Pro',
      company_name_ar: 'برو المخزون',
      tagline: 'Professional Inventory & POS System',
      business_address: null,
      business_phone: null,
      business_email: null,
      business_website: null,
      tax_id: null,
      logo_original: null,
      logo_header: null,
      logo_receipt: null,
      logo_pdf: null,
      logo_email: null,
      logo_thumbnail: null,
      logo_base64: null,
      favicon_32: null,
      favicon_16: null,
      primary_color: '#3B82F6',
      secondary_color: '#8B5CF6',
      accent_color: '#EC4899',
      success_color: '#10B981',
      warning_color: '#F59E0B',
      error_color: '#EF4444',
      color_palette: null,
      font_family: 'INTER',
      font_family_custom: null,
      heading_font: null,
      body_font: null,
      theme_mode: 'LIGHT',
      generated_css: null,
      css_version: 1,
      receipt_header_text: null,
      receipt_footer_text: 'Thank you for your business!',
      receipt_logo_position: 'CENTER',
      receipt_logo_size: 200,
      show_logo_on_receipt: true,
      invoice_template: 'modern',
      invoice_header_color: null,
      invoice_watermark: null,
      show_watermark: false,
      watermark_opacity: 10,
      is_active: true,
      is_default: true,
      created_by_id: null,
      updated_by_id: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  /**
   * Create branding profile
   */
  static async createBranding(params: CreateBrandingParams) {
    // Validate colors
    this.validateColors(params);

    // Create profile
    const profile = await prisma.brandingProfile.create({
      data: {
        company_name: params.company_name,
        company_name_ar: params.company_name_ar,
        tagline: params.tagline,
        business_address: params.business_address,
        business_phone: params.business_phone,
        business_email: params.business_email,
        business_website: params.business_website,
        tax_id: params.tax_id,
        primary_color: params.primary_color || '#3B82F6',
        secondary_color: params.secondary_color || '#8B5CF6',
        accent_color: params.accent_color || '#EC4899',
        success_color: params.success_color || '#10B981',
        warning_color: params.warning_color || '#F59E0B',
        error_color: params.error_color || '#EF4444',
        font_family: params.font_family as any || 'INTER',
        theme_mode: params.theme_mode as any || 'LIGHT',
        receipt_header_text: params.receipt_header_text,
        receipt_footer_text: params.receipt_footer_text || 'Thank you for your business!',
        receipt_logo_position: params.receipt_logo_position as any || 'CENTER',
        invoice_template: params.invoice_template || 'modern',
        invoice_watermark: params.invoice_watermark,
        show_watermark: params.show_watermark || false,
        created_by_id: params.created_by_id,
      },
    });

    return profile;
  }

  /**
   * Update branding profile
   */
  static async updateBranding(profileId: string, params: Partial<CreateBrandingParams>, updatedById: string) {
    // Validate colors if provided
    if (params.primary_color || params.secondary_color || params.accent_color) {
      this.validateColors(params);
    }

    const updateData: any = {
      ...params,
      updated_by_id: updatedById,
      css_version: { increment: 1 }, // Invalidate CSS cache
    };

    const profile = await prisma.brandingProfile.update({
      where: { id: profileId },
      data: updateData,
    });

    return profile;
  }

  /**
   * Upload and process logo
   */
  static async uploadLogo(profileId: string, file: Express.Multer.File) {
    // Handle both disk and memory storage
    const filePath = file.path;
    const fileBuffer = file.buffer;

    let logos: any;

    if (fileBuffer) {
      // Process from memory buffer
      logos = await this.processLogoSizesFromBuffer(fileBuffer);
    } else if (filePath) {
      // Process from disk file
      const uploadDir = path.join(process.cwd(), 'uploads', 'branding', profileId);
      
      // Create directory if not exists
      try {
        await fs.mkdir(uploadDir, { recursive: true });
      } catch (error) {
        console.warn('Could not create upload directory, using memory processing:', error);
        logos = await this.processLogoSizesFromBuffer(await fs.readFile(filePath));
      }

      if (!logos) {
        logos = await this.processLogoSizes(filePath, uploadDir);
      }

      // Delete temporary uploaded file
      await fs.unlink(filePath).catch(() => {});
    } else {
      throw new Error('No file data available');
    }

    // Update profile with logo paths
    const profile = await prisma.brandingProfile.update({
      where: { id: profileId },
      data: {
        logo_original: logos.original,
        logo_header: logos.header,
        logo_receipt: logos.receipt,
        logo_pdf: logos.pdf,
        logo_email: logos.email,
        logo_thumbnail: logos.thumbnail,
        logo_base64: logos.base64,
        favicon_32: logos.favicon32,
        favicon_16: logos.favicon16,
      },
    });

    return profile;
  }

  /**
   * Process logo into multiple sizes
   */
  private static async processLogoSizes(sourcePath: string, outputDir: string) {
    const sizes = [
      { name: 'original', width: null, height: null },
      { name: 'header', width: 180, height: 60 },
      { name: 'receipt', width: 200, height: 80 },
      { name: 'pdf', width: 300, height: 100 },
      { name: 'email', width: 400, height: 150 },
      { name: 'thumbnail', width: 64, height: 64 },
      { name: 'favicon32', width: 32, height: 32 },
      { name: 'favicon16', width: 16, height: 16 },
    ];

    const paths: any = {};

    for (const size of sizes) {
      const filename = `logo_${size.name}.png`;
      const outputPath = path.join(outputDir, filename);
      const relativePath = `/uploads/branding/${path.basename(outputDir)}/${filename}`;

      let processor = sharp(sourcePath);

      if (size.width && size.height) {
        processor = processor.resize(size.width, size.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        });
      }

      await processor.png().toFile(outputPath);
      paths[size.name] = relativePath;
    }

    // Generate base64 for receipts (200x80)
    const base64Buffer = await sharp(sourcePath)
      .resize(200, 80, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toBuffer();

    paths.base64 = `data:image/png;base64,${base64Buffer.toString('base64')}`;

    return paths;
  }

  /**
   * Process logo into multiple sizes from buffer (for memory storage)
   */
  private static async processLogoSizesFromBuffer(buffer: Buffer) {
    const sizes = [
      { name: 'original', width: null, height: null },
      { name: 'header', width: 180, height: 60 },
      { name: 'receipt', width: 200, height: 80 },
      { name: 'pdf', width: 300, height: 100 },
      { name: 'email', width: 400, height: 150 },
      { name: 'thumbnail', width: 64, height: 64 },
      { name: 'favicon32', width: 32, height: 32 },
      { name: 'favicon16', width: 16, height: 16 },
    ];

    const paths: any = {};

    for (const size of sizes) {
      let processor = sharp(buffer);

      if (size.width && size.height) {
        processor = processor.resize(size.width, size.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        });
      }

      const processedBuffer = await processor.png().toBuffer();
      const base64 = `data:image/png;base64,${processedBuffer.toString('base64')}`;
      paths[size.name] = base64;
    }

    // Generate base64 for receipts (200x80)
    const base64Buffer = await sharp(buffer)
      .resize(200, 80, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toBuffer();

    paths.base64 = `data:image/png;base64,${base64Buffer.toString('base64')}`;

    return paths;
  }

  /**
   * Delete branding profile and logos
   */
  static async deleteBranding(profileId: string) {
    const profile = await prisma.brandingProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      throw new Error('Branding profile not found');
    }

    // Delete logo files
    const uploadDir = path.join(process.cwd(), 'uploads', 'branding', profileId);
    await fs.rm(uploadDir, { recursive: true, force: true }).catch(() => {});

    // Delete profile
    return await prisma.brandingProfile.delete({
      where: { id: profileId },
    });
  }

  /**
   * Set as active branding
   */
  static async setActive(profileId: string) {
    // Deactivate all others
    await prisma.brandingProfile.updateMany({
      where: { is_active: true },
      data: { is_active: false },
    });

    // Activate this one
    return await prisma.brandingProfile.update({
      where: { id: profileId },
      data: { is_active: true },
    });
  }

  /**
   * Validate hex colors
   */
  private static validateColors(params: Partial<CreateBrandingParams>) {
    const hexRegex = /^#[0-9A-F]{6}$/i;
    
    const colorFields = [
      'primary_color',
      'secondary_color',
      'accent_color',
      'success_color',
      'warning_color',
      'error_color',
    ];

    for (const field of colorFields) {
      const value = params[field as keyof CreateBrandingParams];
      if (value && !hexRegex.test(value as string)) {
        throw new Error(`Invalid ${field}: must be hex color (e.g., #3B82F6)`);
      }
    }
  }

  /**
   * List all branding profiles
   */
  static async listBrandings() {
    return await prisma.brandingProfile.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        created_by: {
          select: {
            id: true,
            username: true,
            display_name: true,
          },
        },
      },
    });
  }
}

