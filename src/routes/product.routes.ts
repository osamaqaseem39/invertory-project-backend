import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { ProductService } from '../services/product.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import {
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
} from '../validators/product.validator';

const router = Router();

/**
 * GET /products
 * List products with search and filters
 */
router.get(
  '/',
  authenticateToken,
  validateQuery(listProductsQuerySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const query = req.query as any;

      const result = await ProductService.listProducts(req.user!.role as UserRole, {
        q: query.q,
        categoryId: query.category_id,
        brand: query.brand,
        isArchived: query.is_archived,
        isActive: query.is_active,
        page: query.page,
        limit: query.limit,
        sort: query.sort,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /products/stats
 * Get product statistics for dashboard
 */
router.get(
  '/stats',
  authenticateToken,
  async (_req: AuthRequest, res, next) => {
    try {
      const stats = await ProductService.getProductStatistics();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /products/:id
 * Get product by ID
 */
router.get(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const product = await ProductService.getProductById(
        req.params.id,
        req.user!.role as UserRole
      );

      res.json(product);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /products
 * Create a new product
 */
router.post(
  '/',
  authenticateToken,
  validateBody(createProductSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const product = await ProductService.createProduct(
        {
          ...req.body,
          createdById: req.user!.id,
        },
        req.user!.role as UserRole,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );

      res.status(201).json({
        message: 'Product created successfully',
        product,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /products/:id
 * Update product
 */
router.put(
  '/:id',
  authenticateToken,
  validateBody(updateProductSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const product = await ProductService.updateProduct(
        req.params.id,
        req.user!.id,
        req.user!.role as UserRole,
        req.body,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );

      res.json({
        message: 'Product updated successfully',
        product,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /products/:id/archive
 * Archive product
 */
router.patch(
  '/:id/archive',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const product = await ProductService.archiveProduct(
        req.params.id,
        req.user!.id,
        req.user!.role as UserRole,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );

      res.json({
        message: 'Product archived successfully',
        product,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /products/:id/restore
 * Restore archived product
 */
router.patch(
  '/:id/restore',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const product = await ProductService.restoreProduct(
        req.params.id,
        req.user!.id,
        req.user!.role as UserRole,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );

      res.json({
        message: 'Product restored successfully',
        product,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

