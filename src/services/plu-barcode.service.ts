import { PrismaClient, UserRole } from '@prisma/client';
import { AuthorizationError, ValidationError, NotFoundError } from '../utils/errors';

const prisma = new PrismaClient();

// ===== INTERFACES =====

interface AddBarcodeAliasParams {
  product_id: string;
  barcode: string;
  description?: string;
}

interface AddPLUCodeParams {
  product_id: string;
  plu_code: string;
  is_weighted?: boolean;
  price_per_unit?: number;
}

interface SearchByPLUParams {
  plu_code: string;
}

interface CalculateWeightedPriceParams {
  plu_code: string;
  weight: number; // in kg or lb
}

interface ServiceContext {
  actorId: string;
  actorRole: UserRole;
}

// ===== SERVICE =====

export class PLUBarcodeService {
  /**
   * Add a barcode alias to a product
   */
  static async addBarcodeAlias(params: AddBarcodeAliasParams, context: ServiceContext) {
    // RBAC: Admin, owner, inventory_manager
    if (!['admin', 'owner_ultimate_super_admin', 'inventory_manager'].includes(context.actorRole)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: params.product_id },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Check if barcode already exists (on products or aliases)
    const existingProduct = await prisma.product.findUnique({
      where: { barcode: params.barcode },
    });

    const existingAlias = await prisma.barcodeAlias.findUnique({
      where: { barcode: params.barcode },
    });

    if (existingProduct) {
      throw new ValidationError('Barcode already assigned to another product');
    }

    if (existingAlias) {
      throw new ValidationError('Barcode alias already exists');
    }

    // Create alias
    const alias = await prisma.barcodeAlias.create({
      data: {
        product_id: params.product_id,
        barcode: params.barcode,
        description: params.description,
      },
    });

    return alias;
  }

  /**
   * Search product by barcode or alias
   */
  static async searchByBarcodeOrAlias(barcode: string) {
    // First check main barcode
    let product = await prisma.product.findUnique({
      where: { barcode },
      include: {
        images: true,
        category: true,
      },
    });

    if (product) {
      return product;
    }

    // Then check aliases
    const alias = await prisma.barcodeAlias.findUnique({
      where: { barcode },
      include: {
        product: {
          include: {
            images: true,
            category: true,
          },
        },
      },
    });

    if (alias) {
      return alias.product;
    }

    return null;
  }

  /**
   * List all barcode aliases for a product
   */
  static async getProductAliases(productId: string) {
    const aliases = await prisma.barcodeAlias.findMany({
      where: {
        product_id: productId,
        is_active: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return aliases;
  }

  /**
   * Add a PLU code to a product
   */
  static async addPLUCode(params: AddPLUCodeParams, context: ServiceContext) {
    if (!['admin', 'owner_ultimate_super_admin', 'inventory_manager'].includes(context.actorRole)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: params.product_id },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Check if PLU already exists
    const existing = await prisma.pLUCode.findUnique({
      where: { plu_code: params.plu_code },
    });

    if (existing) {
      throw new ValidationError('PLU code already exists');
    }

    // For weighted items, price_per_unit is required
    if (params.is_weighted && !params.price_per_unit) {
      throw new ValidationError('Price per unit required for weighted items');
    }

    const pluCode = await prisma.pLUCode.create({
      data: {
        plu_code: params.plu_code,
        product_id: params.product_id,
        is_weighted: params.is_weighted || false,
        price_per_unit: params.price_per_unit,
      },
    });

    return pluCode;
  }

  /**
   * Search product by PLU code
   */
  static async searchByPLU(params: SearchByPLUParams) {
    const pluCode = await prisma.pLUCode.findUnique({
      where: { plu_code: params.plu_code },
      include: {
        product: {
          include: {
            images: true,
            category: true,
          },
        },
      },
    });

    if (!pluCode) {
      return null;
    }

    return pluCode;
  }

  /**
   * Calculate price for weighted item
   */
  static async calculateWeightedPrice(params: CalculateWeightedPriceParams): Promise<{
    product: any;
    weight: number;
    price_per_unit: number;
    total_price: number;
  }> {
    const pluCode = await this.searchByPLU({ plu_code: params.plu_code });

    if (!pluCode) {
      throw new NotFoundError('PLU code not found');
    }

    if (!pluCode.is_weighted) {
      throw new ValidationError('This product is not sold by weight');
    }

    if (!pluCode.price_per_unit) {
      throw new ValidationError('Price per unit not configured');
    }

    const totalPrice = params.weight * Number(pluCode.price_per_unit);

    return {
      product: pluCode.product,
      weight: params.weight,
      price_per_unit: Number(pluCode.price_per_unit),
      total_price: totalPrice,
    };
  }

}

export default PLUBarcodeService;

