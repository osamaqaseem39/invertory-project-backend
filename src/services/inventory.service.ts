import { UserRole, POStatus, AdjustmentStatus, StockMovementType, Prisma } from '@prisma/client';
import prisma from '../database/client';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';
import {
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CreateSupplierDTO,
  UpdateSupplierDTO,
  CreatePODTO,
  CreateGRNDTO,
  CreateStockAdjustmentDTO,
} from '../validators/inventory.validator';

// ===== RBAC PERMISSIONS =====

const CATEGORY_MANAGE_ROLES: UserRole[] = [UserRole.owner_ultimate_super_admin, UserRole.admin];
const SUPPLIER_MANAGE_ROLES: UserRole[] = [UserRole.owner_ultimate_super_admin, UserRole.admin, UserRole.inventory_manager];
const PO_CREATE_ROLES: UserRole[] = [UserRole.owner_ultimate_super_admin, UserRole.admin, UserRole.inventory_manager];
const PO_APPROVE_ROLES: UserRole[] = [UserRole.owner_ultimate_super_admin, UserRole.admin];
const GRN_CREATE_ROLES: UserRole[] = [UserRole.owner_ultimate_super_admin, UserRole.admin, UserRole.inventory_manager];
const ADJUSTMENT_CREATE_ROLES: UserRole[] = [UserRole.owner_ultimate_super_admin, UserRole.admin, UserRole.inventory_manager];
const ADJUSTMENT_APPROVE_ROLES: UserRole[] = [UserRole.owner_ultimate_super_admin, UserRole.admin];

export class InventoryService {
  // ===== CATEGORY MANAGEMENT =====

  static async createCategory(data: CreateCategoryDTO, actorRole: UserRole) {
    if (!CATEGORY_MANAGE_ROLES.includes(actorRole)) {
      throw new AuthorizationError('You do not have permission to create categories');
    }

    const category = await prisma.category.create({ data });
    logger.info({ categoryId: category.id }, 'Category created');
    return category;
  }

  static async listCategories(params: { parentId?: string; isActive?: boolean }) {
    const where: Prisma.CategoryWhereInput = {};
    
    if (params.parentId !== undefined) {
      where.parent_id = params.parentId === 'null' ? null : params.parentId;
    }
    if (params.isActive !== undefined) {
      where.is_active = params.isActive;
    }

    return prisma.category.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { children: true, products: true } },
      },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    });
  }

  static async getCategoryById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new NotFoundError('Category');
    }

    return category;
  }

  static async updateCategory(id: string, data: UpdateCategoryDTO, actorRole: UserRole) {
    if (!CATEGORY_MANAGE_ROLES.includes(actorRole)) {
      throw new AuthorizationError('You do not have permission to update categories');
    }

    const category = await prisma.category.update({
      where: { id },
      data,
    });

    logger.info({ categoryId: category.id }, 'Category updated');
    return category;
  }

  static async deleteCategory(id: string, actorRole: UserRole) {
    if (!CATEGORY_MANAGE_ROLES.includes(actorRole)) {
      throw new AuthorizationError('You do not have permission to delete categories');
    }

    // Check if category has products
    const count = await prisma.product.count({ where: { category_id: id } });
    if (count > 0) {
      throw new ValidationError(`Cannot delete category with ${count} product(s)`);
    }

    // Check if category has children
    const childCount = await prisma.category.count({ where: { parent_id: id } });
    if (childCount > 0) {
      throw new ValidationError(`Cannot delete category with ${childCount} subcategory(ies)`);
    }

    await prisma.category.delete({ where: { id } });
    logger.info({ categoryId: id }, 'Category deleted');
  }

  // ===== SUPPLIER MANAGEMENT =====

  static async createSupplier(data: CreateSupplierDTO, actorRole: UserRole) {
    if (!SUPPLIER_MANAGE_ROLES.includes(actorRole)) {
      throw new AuthorizationError('You do not have permission to create suppliers');
    }

    const supplier = await prisma.supplier.create({ data });
    logger.info({ supplierId: supplier.id }, 'Supplier created');
    return supplier;
  }

  static async listSuppliers(params: { q?: string; isActive?: boolean }) {
    const where: Prisma.SupplierWhereInput = {};
    
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { contact_person: { contains: params.q, mode: 'insensitive' } },
        { email: { contains: params.q, mode: 'insensitive' } },
      ];
    }
    if (params.isActive !== undefined) {
      where.is_active = params.isActive;
    }

    return prisma.supplier.findMany({
      where,
      include: {
        _count: { select: { purchase_orders: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getSupplierById(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: { select: { purchase_orders: true } },
      },
    });

    if (!supplier) {
      throw new NotFoundError('Supplier');
    }

    return supplier;
  }

  static async updateSupplier(id: string, data: UpdateSupplierDTO, actorRole: UserRole) {
    if (!SUPPLIER_MANAGE_ROLES.includes(actorRole)) {
      throw new AuthorizationError('You do not have permission to update suppliers');
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data,
    });

    logger.info({ supplierId: supplier.id }, 'Supplier updated');
    return supplier;
  }

  // ===== PURCHASE ORDER MANAGEMENT =====

  static async generatePONumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastPO = await prisma.purchaseOrder.findFirst({
      where: {
        po_number: { startsWith: `PO-${year}-` },
      },
      orderBy: { created_at: 'desc' },
    });

    let sequence = 1;
    if (lastPO) {
      const parts = lastPO.po_number.split('-');
      sequence = parseInt(parts[2], 10) + 1;
    }

    return `PO-${year}-${sequence.toString().padStart(4, '0')}`;
  }

  static async createPurchaseOrder(data: CreatePODTO, actorId: string, actorRole: UserRole) {
    if (!PO_CREATE_ROLES.includes(actorRole)) {
      throw new AuthorizationError('You do not have permission to create purchase orders');
    }

    const poNumber = await this.generatePONumber();

    // Calculate total
    const total = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    const po = await prisma.purchaseOrder.create({
      data: {
        po_number: poNumber,
        supplier_id: data.supplier_id,
        expected_date: data.expected_date ? new Date(data.expected_date) : null,
        notes: data.notes,
        total_amount: total,
        created_by_id: actorId,
        status: POStatus.DRAFT,
        items: {
          create: data.items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
        },
      },
      include: {
        supplier: true,
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
      },
    });

    logger.info({ poId: po.id, poNumber: po.po_number }, 'Purchase order created');
    return po;
  }

  static async listPurchaseOrders(params: {
    supplierId?: string;
    status?: POStatus;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseOrderWhereInput = {};
    
    if (params.supplierId) where.supplier_id = params.supplierId;
    if (params.status) where.status = params.status;
    if (params.fromDate || params.toDate) {
      where.created_at = {};
      if (params.fromDate) where.created_at.gte = new Date(params.fromDate);
      if (params.toDate) where.created_at.lte = new Date(params.toDate);
    }

    const [data, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
          _count: { select: { items: true, goods_receipts: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  static async getPurchaseOrderById(id: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, uom: true } },
            _count: { select: { grn_items: true } },
          },
        },
        goods_receipts: {
          include: {
            items: { select: { received_quantity: true } },
          },
        },
      },
    });

    if (!po) {
      throw new NotFoundError('Purchase Order');
    }

    return po;
  }

  static async approvePurchaseOrder(id: string, actorId: string, actorRole: UserRole) {
    if (!PO_APPROVE_ROLES.includes(actorRole)) {
      throw new AuthorizationError('You do not have permission to approve purchase orders');
    }

    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) {
      throw new NotFoundError('Purchase Order');
    }

    if (po.status !== POStatus.DRAFT && po.status !== POStatus.SUBMITTED) {
      throw new ValidationError('Purchase order cannot be approved in current status');
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: POStatus.APPROVED,
        approved_by_id: actorId,
        approved_at: new Date(),
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    logger.info({ poId: id, approvedBy: actorId }, 'Purchase order approved');
    return updated;
  }

  // ===== GOODS RECEIPT (GRN) MANAGEMENT =====

  static async generateGRNNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastGRN = await prisma.goodsReceipt.findFirst({
      where: {
        grn_number: { startsWith: `GRN-${year}-` },
      },
      orderBy: { created_at: 'desc' },
    });

    let sequence = 1;
    if (lastGRN) {
      const parts = lastGRN.grn_number.split('-');
      sequence = parseInt(parts[2], 10) + 1;
    }

    return `GRN-${year}-${sequence.toString().padStart(4, '0')}`;
  }

  static async createGoodsReceipt(data: CreateGRNDTO, actorId: string, actorRole: UserRole) {
    if (!GRN_CREATE_ROLES.includes(actorRole)) {
      throw new AuthorizationError('You do not have permission to create goods receipts');
    }

    // Verify PO exists and is approved
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: data.po_id },
      include: { items: true },
    });

    if (!po) {
      throw new NotFoundError('Purchase Order');
    }

    if (po.status !== POStatus.APPROVED && po.status !== POStatus.PARTIALLY_RECEIVED) {
      throw new ValidationError('Purchase order must be approved before receiving goods');
    }

    const grnNumber = await this.generateGRNNumber();

    // Create GRN and update stock in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create GRN
      const grn = await tx.goodsReceipt.create({
        data: {
          grn_number: grnNumber,
          po_id: data.po_id,
          received_date: new Date(data.received_date),
          received_by_id: actorId,
          notes: data.notes,
          items: {
            create: data.items.map(item => ({
              po_item_id: item.po_item_id,
              product_id: item.product_id,
              expected_quantity: item.expected_quantity,
              received_quantity: item.received_quantity,
              damaged_quantity: item.damaged_quantity || 0,
              notes: item.notes,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });

      // Update stock for each item
      for (const item of data.items) {
        const netReceived = item.received_quantity - (item.damaged_quantity || 0);
        
        // Update product stock
        await tx.product.update({
          where: { id: item.product_id },
          data: {
            stock_quantity: { increment: netReceived },
          },
        });

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            product_id: item.product_id,
            movement_type: StockMovementType.IN,
            quantity: netReceived,
            reference_number: grnNumber,
            reason: `Goods received against PO ${po.po_number}`,
            performed_by_id: actorId,
          },
        });

        // Update PO item received quantity
        await tx.purchaseOrderItem.update({
          where: { id: item.po_item_id },
          data: {
            received_quantity: { increment: item.received_quantity },
          },
        });
      }

      // Update PO status
      const updatedPOItems = await tx.purchaseOrderItem.findMany({
        where: { po_id: data.po_id },
      });

      const allReceived = updatedPOItems.every(item => item.received_quantity >= item.quantity);
      const anyReceived = updatedPOItems.some(item => item.received_quantity > 0);

      await tx.purchaseOrder.update({
        where: { id: data.po_id },
        data: {
          status: allReceived ? POStatus.RECEIVED : anyReceived ? POStatus.PARTIALLY_RECEIVED : POStatus.APPROVED,
        },
      });

      return grn;
    });

    logger.info({ grnId: result.id, grnNumber: result.grn_number, poId: data.po_id }, 'Goods receipt created');
    return result;
  }

  static async listGoodsReceipts(params: {
    poId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.GoodsReceiptWhereInput = {};
    
    if (params.poId) where.po_id = params.poId;
    if (params.fromDate || params.toDate) {
      where.received_date = {};
      if (params.fromDate) where.received_date.gte = new Date(params.fromDate);
      if (params.toDate) where.received_date.lte = new Date(params.toDate);
    }

    const [data, total] = await Promise.all([
      prisma.goodsReceipt.findMany({
        where,
        include: {
          po: { select: { id: true, po_number: true, supplier: { select: { name: true } } } },
          _count: { select: { items: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.goodsReceipt.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ===== STOCK ADJUSTMENT MANAGEMENT =====

  static async generateAdjustmentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastAdj = await prisma.stockAdjustment.findFirst({
      where: {
        adjustment_number: { startsWith: `ADJ-${year}-` },
      },
      orderBy: { created_at: 'desc' },
    });

    let sequence = 1;
    if (lastAdj) {
      const parts = lastAdj.adjustment_number.split('-');
      sequence = parseInt(parts[2], 10) + 1;
    }

    return `ADJ-${year}-${sequence.toString().padStart(4, '0')}`;
  }

  static async createStockAdjustment(data: CreateStockAdjustmentDTO, actorId: string, actorRole: UserRole) {
    if (!ADJUSTMENT_CREATE_ROLES.includes(actorRole)) {
      throw new AuthorizationError('You do not have permission to create stock adjustments');
    }

    // Get current stock
    const product = await prisma.product.findUnique({ where: { id: data.product_id } });
    if (!product) {
      throw new NotFoundError('Product');
    }

    const adjNumber = await this.generateAdjustmentNumber();
    const difference = data.new_quantity - product.stock_quantity;

    const adjustment = await prisma.stockAdjustment.create({
      data: {
        adjustment_number: adjNumber,
        product_id: data.product_id,
        old_quantity: product.stock_quantity,
        new_quantity: data.new_quantity,
        difference,
        reason: data.reason,
        notes: data.notes,
        created_by_id: actorId,
        status: AdjustmentStatus.PENDING,
      },
      include: {
        product: { select: { id: true, name: true, sku: true, stock_quantity: true } },
      },
    });

    logger.info({ adjustmentId: adjustment.id, adjustmentNumber: adjustment.adjustment_number }, 'Stock adjustment created');
    return adjustment;
  }

  static async approveStockAdjustment(id: string, approved: boolean, actorId: string, actorRole: UserRole) {
    if (!ADJUSTMENT_APPROVE_ROLES.includes(actorRole)) {
      throw new AuthorizationError('You do not have permission to approve stock adjustments');
    }

    const adjustment = await prisma.stockAdjustment.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!adjustment) {
      throw new NotFoundError('Stock Adjustment');
    }

    if (adjustment.status !== AdjustmentStatus.PENDING) {
      throw new ValidationError('Stock adjustment is not pending approval');
    }

    // Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update adjustment status
      const updated = await tx.stockAdjustment.update({
        where: { id },
        data: {
          status: approved ? AdjustmentStatus.APPROVED : AdjustmentStatus.REJECTED,
          approved_by_id: actorId,
          approved_at: new Date(),
        },
        include: { product: true },
      });

      if (approved) {
        // Update product stock
        await tx.product.update({
          where: { id: adjustment.product_id },
          data: { stock_quantity: adjustment.new_quantity },
        });

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            product_id: adjustment.product_id,
            movement_type: StockMovementType.ADJUSTMENT,
            quantity: Math.abs(adjustment.difference),
            reference_number: adjustment.adjustment_number,
            reason: `Stock adjustment: ${adjustment.reason}`,
            performed_by_id: actorId,
          },
        });
      }

      return updated;
    });

    logger.info({ adjustmentId: id, approved, approvedBy: actorId }, 'Stock adjustment processed');
    return result;
  }

  static async listStockAdjustments(params: { productId?: string; status?: AdjustmentStatus; fromDate?: string; toDate?: string; page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;
    const where: Prisma.StockAdjustmentWhereInput = {};
    if (params.productId) where.product_id = params.productId;
    if (params.status) where.status = params.status;
    if (params.fromDate || params.toDate) {
      where.created_at = {};
      if (params.fromDate) where.created_at.gte = new Date(params.fromDate);
      if (params.toDate) where.created_at.lte = new Date(params.toDate);
    }
    const [data, total] = await Promise.all([
      prisma.stockAdjustment.findMany({ where, include: { product: { select: { id: true, name: true, sku: true } } }, orderBy: { created_at: 'desc' }, skip, take: limit }),
      prisma.stockAdjustment.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  static async listStockMovements(params: { productId?: string; movementType?: StockMovementType; fromDate?: string; toDate?: string; page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;
    const where: Prisma.StockMovementWhereInput = {};
    if (params.productId) where.product_id = params.productId;
    if (params.movementType) where.movement_type = params.movementType;
    if (params.fromDate || params.toDate) {
      where.created_at = {};
      if (params.fromDate) where.created_at.gte = new Date(params.fromDate);
      if (params.toDate) where.created_at.lte = new Date(params.toDate);
    }
    const [data, total] = await Promise.all([
      prisma.stockMovement.findMany({ where, include: { product: { select: { id: true, name: true, sku: true } } }, orderBy: { created_at: 'desc' }, skip, take: limit }),
      prisma.stockMovement.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  static async getLowStockProducts() {
    return [];
  }

  static async getInventoryStats() {
    const total = await prisma.product.count();
    return { totalProducts: total, activeProducts: total, lowStockCount: 0, outOfStockCount: 0, totalStockQuantity: 0 };
  }
}
