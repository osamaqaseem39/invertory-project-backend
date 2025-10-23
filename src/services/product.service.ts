import { Product, ProductImage, UserRole, AuditAction, Prisma } from '@prisma/client';
import prisma from '../database/client';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';
import { ProductRBACService } from './product.rbac.service';
import { AuditService } from './audit.service';
import logger from '../utils/logger';

interface CreateProductParams {
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  brand?: string | null;
  category_id?: string | null;
  stock_quantity?: number;
  reorder_level?: number;
  reorder_quantity?: number;
  max_stock_level?: number | null;
  location?: string | null;
  price: number;
  cost?: number | null;
  uom?: string;
  images?: Array<{url: string; is_primary?: boolean}>;
  createdById: string;
}

interface UpdateProductParams {
  sku?: string;
  barcode?: string | null;
  name?: string;
  description?: string | null;
  brand?: string | null;
  category_id?: string | null;
  stock_quantity?: number;
  reorder_level?: number;
  reorder_quantity?: number;
  max_stock_level?: number | null;
  location?: string | null;
  price?: number;
  cost?: number | null;
  uom?: string;
  is_active?: boolean;
  images?: Array<{url: string; is_primary?: boolean}>;
}

interface ListProductsParams {
  q?: string;
  categoryId?: string;
  brand?: string;
  isArchived?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
}

interface AuthContext {
  ipAddress?: string;
  userAgent?: string;
}

export class ProductService {
  /**
   * Create a new product with RBAC enforcement
   */
  static async createProduct(
    params: CreateProductParams,
    actorRole: UserRole,
    context: AuthContext
  ): Promise<Product & { images: ProductImage[] }> {
    // Enforce RBAC
    ProductRBACService.enforceCanCreate(actorRole);

    // Check for duplicate SKU
    const existingSku = await prisma.product.findUnique({
      where: { sku: params.sku },
    });

    if (existingSku) {
      throw new ConflictError('SKU already exists', { field: 'sku' });
    }

    // Check for duplicate barcode (if provided)
    if (params.barcode) {
      const existingBarcode = await prisma.product.findUnique({
        where: { barcode: params.barcode },
      });

      if (existingBarcode) {
        throw new ConflictError('Barcode already exists', { field: 'barcode' });
      }
    }

    // Validate images - only one primary
    if (params.images && params.images.length > 0) {
      const primaryCount = params.images.filter(img => img.is_primary).length;
      if (primaryCount > 1) {
        throw new ValidationError('Only one image can be set as primary');
      }
      // If no primary set, make the first one primary
      if (primaryCount === 0) {
        params.images[0].is_primary = true;
      }
    }

    // Create product with images
    const product = await prisma.product.create({
      data: {
        sku: params.sku,
        barcode: params.barcode,
      name: params.name,
      description: params.description,
      brand: params.brand,
      category_id: params.category_id,
      stock_quantity: params.stock_quantity || 0,
      reorder_level: params.reorder_level || 0,
      reorder_quantity: params.reorder_quantity || 0,
      max_stock_level: params.max_stock_level,
      location: params.location,
      price: params.price,
      cost: params.cost,
      uom: params.uom || 'unit',
        created_by_id: params.createdById,
        images: params.images ? {
          create: params.images.map(img => ({
            url: img.url,
            is_primary: img.is_primary || false,
          })),
        } : undefined,
      },
      include: {
        images: true,
        created_by: {
          select: { id: true, username: true, display_name: true },
        },
      },
    });

    // Audit log
    await AuditService.createLog({
      actorUserId: params.createdById,
      action: AuditAction.CREATE_PRODUCT,
      metadata: {
        product_id: product.id,
        sku: product.sku,
        name: product.name,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger.info({
      productId: product.id,
      sku: product.sku,
      createdBy: params.createdById,
    }, 'Product created');

    return product;
  }

  /**
   * Get product by ID with RBAC projection
   */
  static async getProductById(
    productId: string,
    actorRole: UserRole
  ): Promise<Product & { images: ProductImage[] }> {
    const allowedFields = ProductRBACService.getAllowedFields(actorRole);
    const includeImages = allowedFields.includes('images');

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: includeImages,
        created_by: {
          select: { id: true, username: true, display_name: true },
        },
        updated_by: {
          select: { id: true, username: true, display_name: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Product');
    }

    // For guests, apply field projection
    if (actorRole === UserRole.guest) {
      const limitedProduct: any = {};
      allowedFields.forEach(field => {
        if (field === 'images' && product.images) {
          limitedProduct[field] = product.images.filter(img => img.is_primary);
        } else if (field in product) {
          limitedProduct[field] = (product as any)[field];
        }
      });
      return limitedProduct as Product & { images: ProductImage[] };
    }

    return product;
  }

  /**
   * List products with filters and RBAC projection
   */
  static async listProducts(
    actorRole: UserRole,
    params: ListProductsParams
  ): Promise<{
    data: (Product & { images: ProductImage[] })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    // Search query
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { sku: { contains: params.q, mode: 'insensitive' } },
        { brand: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    // Filters
    if (params.categoryId !== undefined) {
      where.category_id = params.categoryId;
    }

    if (params.brand !== undefined) {
      where.brand = params.brand;
    }

    // Only filter by archived status if explicitly requested
    // Default behavior: show only non-archived products
    where.is_archived = params.isArchived !== undefined ? params.isArchived : false;

    // Only filter by active status if explicitly requested
    if (params.isActive !== undefined) {
      where.is_active = params.isActive;
    }

    // Sorting
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (params.sort) {
      const isDesc = params.sort.startsWith('-');
      const field = isDesc ? params.sort.substring(1) : params.sort;
      orderBy[field as keyof Product] = isDesc ? 'desc' : 'asc';
    } else {
      orderBy.created_at = 'desc';
    }

    const allowedFields = ProductRBACService.getAllowedFields(actorRole);
    const includeImages = allowedFields.includes('images');

    logger.info({ where, orderBy, skip, limit }, 'Product query parameters');

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: includeImages,
          created_by: {
            select: { id: true, username: true, display_name: true },
          },
          updated_by: {
            select: { id: true, username: true, display_name: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    logger.info({ productsFound: products.length, total }, 'Products query result');

    // Apply field projection for guests
    let projectedProducts = products;
    if (actorRole === UserRole.guest) {
      projectedProducts = products.map(product => {
        const limitedProduct: any = {};
        allowedFields.forEach(field => {
          if (field === 'images' && product.images) {
            limitedProduct[field] = product.images.filter(img => img.is_primary);
          } else if (field in product) {
            limitedProduct[field] = (product as any)[field];
          }
        });
        return limitedProduct;
      });
    }

    return {
      data: projectedProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update product with RBAC enforcement
   */
  static async updateProduct(
    productId: string,
    actorId: string,
    actorRole: UserRole,
    updates: UpdateProductParams,
    context: AuthContext
  ): Promise<Product & { images: ProductImage[] }> {
    // Enforce RBAC
    ProductRBACService.enforceCanUpdate(actorRole);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!product) {
      throw new NotFoundError('Product');
    }

    // Check for SKU conflict
    if (updates.sku && updates.sku !== product.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: updates.sku },
      });
      if (existingSku) {
        throw new ConflictError('SKU already exists', { field: 'sku' });
      }
    }

    // Check for barcode conflict
    if (updates.barcode && updates.barcode !== product.barcode) {
      const existingBarcode = await prisma.product.findUnique({
        where: { barcode: updates.barcode },
      });
      if (existingBarcode) {
        throw new ConflictError('Barcode already exists', { field: 'barcode' });
      }
    }

    // Handle images update
    let imageOperations: any = undefined;
    if (updates.images) {
      const primaryCount = updates.images.filter(img => img.is_primary).length;
      if (primaryCount > 1) {
        throw new ValidationError('Only one image can be set as primary');
      }
      if (updates.images.length > 0 && primaryCount === 0) {
        updates.images[0].is_primary = true;
      }

      // Delete existing images and create new ones
      imageOperations = {
        deleteMany: {},
        create: updates.images.map(img => ({
          url: img.url,
          is_primary: img.is_primary || false,
        })),
      };
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        ...updates,
        updated_by_id: actorId,
        images: imageOperations,
      },
      include: {
        images: true,
        created_by: {
          select: { id: true, username: true, display_name: true },
        },
        updated_by: {
          select: { id: true, username: true, display_name: true },
        },
      },
    });

    // Audit log
    await AuditService.createLog({
      actorUserId: actorId,
      action: AuditAction.UPDATE_PRODUCT,
      metadata: {
        product_id: productId,
        sku: product.sku,
        changes: updates,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger.info({
      productId,
      actorId,
      changes: Object.keys(updates),
    }, 'Product updated');

    return updatedProduct;
  }

  /**
   * Archive product
   */
  static async archiveProduct(
    productId: string,
    actorId: string,
    actorRole: UserRole,
    context: AuthContext
  ): Promise<Product> {
    // Enforce RBAC
    ProductRBACService.enforceCanArchive(actorRole);

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('Product');
    }

    if (product.is_archived) {
      throw new ValidationError('Product is already archived');
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        is_archived: true,
        updated_by_id: actorId,
      },
    });

    // Audit log
    await AuditService.createLog({
      actorUserId: actorId,
      action: AuditAction.ARCHIVE_PRODUCT,
      metadata: {
        product_id: productId,
        sku: product.sku,
        name: product.name,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger.info({ productId, actorId }, 'Product archived');

    return updatedProduct;
  }

  /**
   * Restore product
   */
  static async restoreProduct(
    productId: string,
    actorId: string,
    actorRole: UserRole,
    context: AuthContext
  ): Promise<Product> {
    // Enforce RBAC
    ProductRBACService.enforceCanArchive(actorRole);

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('Product');
    }

    if (!product.is_archived) {
      throw new ValidationError('Product is not archived');
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        is_archived: false,
        updated_by_id: actorId,
      },
    });

    // Audit log
    await AuditService.createLog({
      actorUserId: actorId,
      action: AuditAction.RESTORE_PRODUCT,
      metadata: {
        product_id: productId,
        sku: product.sku,
        name: product.name,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger.info({ productId, actorId }, 'Product restored');

    return updatedProduct;
  }

  /**
   * Get product statistics for dashboard
   */
  static async getProductStatistics(): Promise<{
    totalProducts: number;
    activeProducts: number;
    archivedProducts: number;
    productsByCategory: Array<{ category: string; count: number }>;
    productsByBrand: Array<{ brand: string; count: number }>;
    recentProducts: Product[];
  }> {
    const [
      totalProducts,
      activeProducts,
      archivedProducts,
      productsByBrand,
      recentProducts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { is_active: true, is_archived: false } }),
      prisma.product.count({ where: { is_archived: true } }),
      prisma.product.groupBy({
        by: ['brand'],
        _count: true,
        where: { is_archived: false, brand: { not: null } },
        orderBy: { _count: { brand: 'desc' } },
        take: 10,
      }),
      prisma.product.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: {
          images: {
            where: { is_primary: true },
            take: 1,
          },
        },
      }),
    ]);

    return {
      totalProducts,
      activeProducts,
      archivedProducts,
      productsByCategory: [],
      productsByBrand: productsByBrand.map(item => ({
        brand: item.brand || 'No Brand',
        count: item._count,
      })),
      recentProducts,
    };
  }
}

