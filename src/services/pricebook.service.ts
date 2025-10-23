import { PrismaClient, UserRole, PricebookType, DiscountType } from '@prisma/client';
import { AuthorizationError, ValidationError, NotFoundError } from '../utils/errors';

const prisma = new PrismaClient();

// ===== INTERFACES =====

interface CreatePriceBookParams {
  name: string;
  description?: string;
  type: PricebookType;
  priority?: number;
  start_at?: Date;
  end_at?: Date;
  store_id?: string;
  terminal_id?: string;
}

interface AddPriceBookItemParams {
  price_book_id: string;
  product_id: string;
  promo_price: number;
  start_at?: Date;
  end_at?: Date;
}

interface CreateCouponParams {
  code: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  max_uses?: number;
  per_customer_limit?: number;
  start_at: Date;
  end_at: Date;
}

interface ApplyCouponParams {
  code: string;
  subtotal: number;
  customer_id?: string;
}

interface ServiceContext {
  actorId: string;
  actorRole: UserRole;
}

// ===== SERVICE =====

export class PriceBookService {
  /**
   * Create a new price book
   */
  static async createPriceBook(params: CreatePriceBookParams, context: ServiceContext) {
    // RBAC: Only admin, owner
    if (!['admin', 'owner_ultimate_super_admin'].includes(context.actorRole)) {
      throw new AuthorizationError('Insufficient permissions to create price book');
    }

    const priceBook = await prisma.priceBook.create({
      data: {
        name: params.name,
        description: params.description,
        type: params.type,
        priority: params.priority || 0,
        start_at: params.start_at,
        end_at: params.end_at,
        store_id: params.store_id,
        terminal_id: params.terminal_id,
        is_active: true,
        created_by_id: context.actorId,
      },
    });

    return priceBook;
  }

  /**
   * Add item to price book
   */
  static async addPriceBookItem(params: AddPriceBookItemParams, context: ServiceContext) {
    if (!['admin', 'owner_ultimate_super_admin'].includes(context.actorRole)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: params.product_id },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Validate promo price
    if (params.promo_price < 0) {
      throw new ValidationError('Promo price cannot be negative');
    }

    // Check if item already exists in price book
    const existing = await prisma.priceBookItem.findFirst({
      where: {
        price_book_id: params.price_book_id,
        product_id: params.product_id,
      },
    });

    if (existing) {
      // Update existing
      return await prisma.priceBookItem.update({
        where: { id: existing.id },
        data: {
          promo_price: params.promo_price,
          start_at: params.start_at,
          end_at: params.end_at,
        },
      });
    }

    // Create new
    const item = await prisma.priceBookItem.create({
      data: {
        price_book_id: params.price_book_id,
        product_id: params.product_id,
        promo_price: params.promo_price,
        start_at: params.start_at,
        end_at: params.end_at,
      },
    });

    return item;
  }

  /**
   * Get active price book for current store/terminal
   */
  static async getActivePriceBook(storeId?: string, terminalId?: string) {
    const now = new Date();

    const priceBook = await prisma.priceBook.findFirst({
      where: {
        is_active: true,
        OR: [
          { store_id: storeId, terminal_id: terminalId },
          { store_id: storeId, terminal_id: null },
          { store_id: null, terminal_id: null },
        ],
        AND: [
          {
            OR: [
              { start_at: null },
              { start_at: { lte: now } },
            ],
          },
          {
            OR: [
              { end_at: null },
              { end_at: { gte: now } },
            ],
          },
        ],
      },
      include: {
        items: {
          where: {
            is_active: true,
            OR: [
              { start_at: null, end_at: null },
              { start_at: { lte: now }, end_at: { gte: now } },
            ],
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: { priority: 'desc' },
    });

    return priceBook;
  }

  /**
   * Resolve price for a product (check promo, fallback to base)
   */
  static async resolvePrice(productId: string, priceBookId?: string): Promise<{
    price: number;
    is_promo: boolean;
    original_price: number;
  }> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { price: true },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const basePrice = Number(product.price);

    if (priceBookId) {
      // Check if product has promo price
      const now = new Date();
      const promoItem = await prisma.priceBookItem.findFirst({
        where: {
          price_book_id: priceBookId,
          product_id: productId,
          is_active: true,
          OR: [
            { start_at: null, end_at: null },
            { start_at: { lte: now }, end_at: { gte: now } },
          ],
        },
      });

      if (promoItem) {
        return {
          price: Number(promoItem.promo_price),
          is_promo: true,
          original_price: basePrice,
        };
      }
    }

    // Fallback to base price
    return {
      price: basePrice,
      is_promo: false,
      original_price: basePrice,
    };
  }

  /**
   * Create a coupon
   */
  static async createCoupon(params: CreateCouponParams, context: ServiceContext) {
    if (!['admin', 'owner_ultimate_super_admin'].includes(context.actorRole)) {
      throw new AuthorizationError('Insufficient permissions to create coupon');
    }

    // Validate code is unique
    const existing = await prisma.coupon.findUnique({
      where: { code: params.code },
    });

    if (existing) {
      throw new ValidationError('Coupon code already exists');
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: params.code.toUpperCase(),
        name: params.name,
        description: params.description,
        type: params.type,
        value: params.value,
        min_purchase_amount: params.min_purchase_amount,
        max_discount_amount: params.max_discount_amount,
        max_uses: params.max_uses,
        per_customer_limit: params.per_customer_limit,
        start_at: params.start_at,
        end_at: params.end_at,
        created_by_id: context.actorId,
      },
    });

    return coupon;
  }

  /**
   * Apply a coupon to a cart
   */
  static async applyCoupon(params: ApplyCouponParams): Promise<{
    valid: boolean;
    discount_amount: number;
    message?: string;
  }> {
    const coupon = await prisma.coupon.findUnique({
      where: { code: params.code.toUpperCase() },
    });

    if (!coupon) {
      return { valid: false, discount_amount: 0, message: 'Coupon not found' };
    }

    if (!coupon.is_active) {
      return { valid: false, discount_amount: 0, message: 'Coupon is inactive' };
    }

    // Check dates
    const now = new Date();
    if (now < coupon.start_at || now > coupon.end_at) {
      return { valid: false, discount_amount: 0, message: 'Coupon is not valid at this time' };
    }

    // Check max uses
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return { valid: false, discount_amount: 0, message: 'Coupon has reached maximum uses' };
    }

    // Check minimum purchase
    if (coupon.min_purchase_amount && params.subtotal < Number(coupon.min_purchase_amount)) {
      return {
        valid: false,
        discount_amount: 0,
        message: `Minimum purchase of $${Number(coupon.min_purchase_amount).toFixed(2)} required`,
      };
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'PERCENT') {
      discountAmount = params.subtotal * (Number(coupon.value) / 100);
    } else {
      discountAmount = Number(coupon.value);
    }

    // Apply max discount cap
    if (coupon.max_discount_amount && discountAmount > Number(coupon.max_discount_amount)) {
      discountAmount = Number(coupon.max_discount_amount);
    }

    // Don't exceed cart total
    if (discountAmount > params.subtotal) {
      discountAmount = params.subtotal;
    }

    // Increment usage
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        current_uses: {
          increment: 1,
        },
      },
    });

    return {
      valid: true,
      discount_amount: discountAmount,
    };
  }

  /**
   * List all price books
   */
  static async listPriceBooks(actorRole: UserRole) {
    if (!['admin', 'owner_ultimate_super_admin'].includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const priceBooks = await prisma.priceBook.findMany({
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
              },
            },
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { created_at: 'desc' },
      ],
    });

    return priceBooks;
  }

  /**
   * List all coupons
   */
  static async listCoupons(actorRole: UserRole) {
    if (!['admin', 'owner_ultimate_super_admin'].includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { created_at: 'desc' },
    });

    return coupons;
  }
}

export default PriceBookService;

