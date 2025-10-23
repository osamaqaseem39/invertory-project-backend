import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { InventoryService } from '../services/inventory.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  listCategoriesQuerySchema,
  createSupplierSchema,
  updateSupplierSchema,
  listSuppliersQuerySchema,
  createPOSchema,
  listPOsQuerySchema,
  createGRNSchema,
  listGRNsQuerySchema,
  createStockAdjustmentSchema,
  approveAdjustmentSchema,
  listAdjustmentsQuerySchema,
  listMovementsQuerySchema,
} from '../validators/inventory.validator';

const router = Router();

// ===== CATEGORY ROUTES =====

router.post(
  '/categories',
  authenticateToken,
  validateBody(createCategorySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const category = await InventoryService.createCategory(
        req.body,
        req.user!.role as UserRole
      );
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/categories',
  authenticateToken,
  validateQuery(listCategoriesQuerySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const query = req.query as any;
      const categories = await InventoryService.listCategories({
        parentId: query.parent_id,
        isActive: query.is_active,
      });
      res.json({ data: categories });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/categories/:id',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const category = await InventoryService.getCategoryById(req.params.id);
      res.json(category);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/categories/:id',
  authenticateToken,
  validateBody(updateCategorySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const category = await InventoryService.updateCategory(
        req.params.id,
        req.body,
        req.user!.role as UserRole
      );
      res.json(category);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/categories/:id',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      await InventoryService.deleteCategory(req.params.id, req.user!.role as UserRole);
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// ===== SUPPLIER ROUTES =====

router.post(
  '/suppliers',
  authenticateToken,
  validateBody(createSupplierSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const supplier = await InventoryService.createSupplier(
        req.body,
        req.user!.role as UserRole
      );
      res.status(201).json(supplier);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/suppliers',
  authenticateToken,
  validateQuery(listSuppliersQuerySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const query = req.query as any;
      const suppliers = await InventoryService.listSuppliers({
        q: query.q,
        isActive: query.is_active,
      });
      res.json({ data: suppliers });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/suppliers/:id',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const supplier = await InventoryService.getSupplierById(req.params.id);
      res.json(supplier);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/suppliers/:id',
  authenticateToken,
  validateBody(updateSupplierSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const supplier = await InventoryService.updateSupplier(
        req.params.id,
        req.body,
        req.user!.role as UserRole
      );
      res.json(supplier);
    } catch (error) {
      next(error);
    }
  }
);

// ===== PURCHASE ORDER ROUTES =====

router.post(
  '/purchase-orders',
  authenticateToken,
  validateBody(createPOSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const po = await InventoryService.createPurchaseOrder(
        req.body,
        req.user!.id,
        req.user!.role as UserRole
      );
      res.status(201).json(po);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/purchase-orders',
  authenticateToken,
  validateQuery(listPOsQuerySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const query = req.query as any;
      const result = await InventoryService.listPurchaseOrders({
        supplierId: query.supplier_id,
        status: query.status,
        fromDate: query.from_date,
        toDate: query.to_date,
        page: query.page,
        limit: query.limit,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/purchase-orders/:id',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const po = await InventoryService.getPurchaseOrderById(req.params.id);
      res.json(po);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/purchase-orders/:id/approve',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const po = await InventoryService.approvePurchaseOrder(
        req.params.id,
        req.user!.id,
        req.user!.role as UserRole
      );
      res.json(po);
    } catch (error) {
      next(error);
    }
  }
);

// ===== GOODS RECEIPT ROUTES =====

router.post(
  '/goods-receipts',
  authenticateToken,
  validateBody(createGRNSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const grn = await InventoryService.createGoodsReceipt(
        req.body,
        req.user!.id,
        req.user!.role as UserRole
      );
      res.status(201).json(grn);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/goods-receipts',
  authenticateToken,
  validateQuery(listGRNsQuerySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const query = req.query as any;
      const result = await InventoryService.listGoodsReceipts({
        poId: query.po_id,
        fromDate: query.from_date,
        toDate: query.to_date,
        page: query.page,
        limit: query.limit,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ===== STOCK ADJUSTMENT ROUTES =====

router.post(
  '/stock-adjustments',
  authenticateToken,
  validateBody(createStockAdjustmentSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const adjustment = await InventoryService.createStockAdjustment(
        req.body,
        req.user!.id,
        req.user!.role as UserRole
      );
      res.status(201).json(adjustment);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/stock-adjustments',
  authenticateToken,
  validateQuery(listAdjustmentsQuerySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const query = req.query as any;
      const result = await InventoryService.listStockAdjustments({
        productId: query.product_id,
        status: query.status,
        fromDate: query.from_date,
        toDate: query.to_date,
        page: query.page,
        limit: query.limit,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/stock-adjustments/:id/approve',
  authenticateToken,
  validateBody(approveAdjustmentSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const adjustment = await InventoryService.approveStockAdjustment(
        req.params.id,
        req.body.approved,
        req.user!.id,
        req.user!.role as UserRole
      );
      res.json(adjustment);
    } catch (error) {
      next(error);
    }
  }
);

// ===== STOCK MOVEMENT ROUTES =====

router.get(
  '/stock-movements',
  authenticateToken,
  validateQuery(listMovementsQuerySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const query = req.query as any;
      const result = await InventoryService.listStockMovements({
        productId: query.product_id,
        movementType: query.movement_type,
        fromDate: query.from_date,
        toDate: query.to_date,
        page: query.page,
        limit: query.limit,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// ===== INVENTORY REPORTS =====

router.get(
  '/low-stock',
  authenticateToken,
  async (_req: AuthRequest, res, next) => {
    try {
      const products = await InventoryService.getLowStockProducts();
      res.json({ data: products });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/stats',
  authenticateToken,
  async (_req: AuthRequest, res, next) => {
    try {
      const stats = await InventoryService.getInventoryStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

