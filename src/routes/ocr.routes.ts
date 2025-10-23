import { Router } from 'express';
import { OCRService } from '../services/ocr.service';
import { uploadReceipt } from '../middleware/upload.middleware';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import {
  uploadDocumentSchema,
  listScansQuerySchema,
  correctProductSchema,
  bulkAddProductsSchema,
  validateFile,
} from '../validators/ocr.validator';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// RBAC helper
const requireRole = (allowedRoles: UserRole[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action',
        },
      });
    }
    next();
  };
};

// Allowed roles for OCR operations
const OCR_UPLOAD_ROLES: UserRole[] = [
  UserRole.owner_ultimate_super_admin,
  UserRole.admin,
  UserRole.inventory_manager,
];

const OCR_VIEW_ROLES: UserRole[] = [
  ...OCR_UPLOAD_ROLES,
  UserRole.cashier, // Can view but not upload/modify
];

/**
 * POST /api/v1/ocr/upload
 * Upload receipt/invoice for OCR processing
 * RBAC: owner, admin, inventory_manager
 */
router.post(
  '/upload',
  requireRole(OCR_UPLOAD_ROLES),
  uploadReceipt.single('file'),
  validateBody(uploadDocumentSchema),
  async (req: any, res) => {
    try {
      // Validate file
      validateFile(req.file);

      const scan = await OCRService.uploadDocument({
        file: req.file,
        sourceType: req.body.sourceType,
        uploadedById: req.user.id,
        sourceReference: req.body.sourceReference,
      });

      return res.status(201).json({
        message: 'Document uploaded successfully',
        data: scan,
      });
    } catch (error: any) {
      return res.status(400).json({
        error: {
          code: 'UPLOAD_FAILED',
          message: error.message,
        },
      });
    }
  }
);

/**
 * POST /api/v1/ocr/scans/:id/process
 * Trigger OCR processing for uploaded document
 * RBAC: owner, admin, inventory_manager
 */
router.post('/scans/:id/process', requireRole(OCR_UPLOAD_ROLES), async (req: any, res) => {
  try {
    const result = await OCRService.processScan(req.params.id);

    if (result.status === 'FAILED') {
      return res.status(500).json({
        error: {
          code: 'OCR_PROCESSING_FAILED',
          message: result.errorMessage || 'OCR processing failed',
        },
        data: result,
      });
    }

    return res.status(200).json({
      message: 'OCR processing completed successfully',
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'OCR_PROCESSING_ERROR',
        message: error.message,
      },
    });
  }
});

/**
 * GET /api/v1/ocr/scans
 * List all OCR scans (with filters)
 * RBAC: owner, admin (all), inventory_manager (own), cashier (view only)
 */
router.get('/scans', requireRole(OCR_VIEW_ROLES), validateQuery(listScansQuerySchema), async (req: any, res) => {
  try {
    const filters: any = {
      status: req.query.status,
      sourceType: req.query.sourceType,
      page: req.query.page,
      limit: req.query.limit,
    };

    // Inventory managers can only see their own scans
    if (req.user.role === UserRole.inventory_manager || req.user.role === UserRole.cashier) {
      filters.userId = req.user.id;
    }

    const scans = await OCRService.listScans(filters);

    return res.status(200).json(scans);
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'LIST_SCANS_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * GET /api/v1/ocr/scans/:id
 * Get scan details with extracted products
 * RBAC: owner, admin, inventory_manager (own), cashier (view only)
 */
router.get('/scans/:id', requireRole(OCR_VIEW_ROLES), async (req: any, res) => {
  try {
    const scan = await OCRService.getScanById(req.params.id);

    if (!scan) {
      return res.status(404).json({
        error: {
          code: 'SCAN_NOT_FOUND',
          message: 'Scan not found',
        },
      });
    }

    // Check ownership for inventory managers
    if (
      req.user.role === UserRole.inventory_manager &&
      scan.uploaded_by_id !== req.user.id
    ) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view your own scans',
        },
      });
    }

    return res.status(200).json({ data: scan });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'GET_SCAN_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * PATCH /api/v1/ocr/scans/:id/review
 * Mark scan as reviewed
 * RBAC: owner, admin, inventory_manager (own)
 */
router.patch('/scans/:id/review', requireRole(OCR_UPLOAD_ROLES), async (req: any, res) => {
  try {
    const scan = await OCRService.reviewScan(req.params.id, req.user.id);

    return res.status(200).json({
      message: 'Scan marked as reviewed',
      data: scan,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'REVIEW_SCAN_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * DELETE /api/v1/ocr/scans/:id
 * Delete scan and associated products
 * RBAC: owner, admin
 */
router.delete(
  '/scans/:id',
  requireRole([UserRole.owner_ultimate_super_admin, UserRole.admin]),
  async (req: any, res) => {
    try {
      const scan = await OCRService.deleteScan(req.params.id);

      return res.status(200).json({
        message: 'Scan deleted successfully',
        data: scan,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: {
          code: 'DELETE_SCAN_FAILED',
          message: error.message,
        },
      });
    }
  }
);

/**
 * POST /api/v1/ocr/products/:id/approve
 * Approve extracted product
 * RBAC: owner, admin, inventory_manager
 */
router.post('/products/:id/approve', requireRole(OCR_UPLOAD_ROLES), async (req: any, res) => {
  try {
    const product = await OCRService.approveProduct(req.params.id);

    return res.status(200).json({
      message: 'Product approved',
      data: product,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: {
        code: 'APPROVE_PRODUCT_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * PATCH /api/v1/ocr/products/:id/correct
 * Correct OCR product data
 * RBAC: owner, admin, inventory_manager
 */
router.patch(
  '/products/:id/correct',
  requireRole(OCR_UPLOAD_ROLES),
  validateBody(correctProductSchema),
  async (req: any, res) => {
    try {
      const product = await OCRService.correctProduct(req.params.id, req.body);

      return res.status(200).json({
        message: 'Product corrected',
        data: product,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: {
          code: 'CORRECT_PRODUCT_FAILED',
          message: error.message,
        },
      });
    }
  }
);

/**
 * POST /api/v1/ocr/products/:id/add
 * Add OCR product to inventory
 * RBAC: owner, admin, inventory_manager
 */
router.post('/products/:id/add', requireRole(OCR_UPLOAD_ROLES), async (req: any, res) => {
  try {
    const product = await OCRService.addProductToInventory(req.params.id, req.user.id);

    return res.status(201).json({
      message: 'Product added to inventory',
      data: product,
    });
  } catch (error: any) {
    return res.status(400).json({
      error: {
        code: 'ADD_PRODUCT_FAILED',
        message: error.message,
      },
    });
  }
});

/**
 * POST /api/v1/ocr/products/bulk-add
 * Bulk add products to inventory
 * RBAC: owner, admin, inventory_manager
 */
router.post(
  '/products/bulk-add',
  requireRole(OCR_UPLOAD_ROLES),
  validateBody(bulkAddProductsSchema),
  async (req: any, res) => {
    try {
      const results = await OCRService.bulkAddProducts(req.body.productIds, req.user.id);

      return res.status(200).json({
        message: `Bulk add completed: ${results.added.length} succeeded, ${results.failed.length} failed`,
        data: results,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: {
          code: 'BULK_ADD_FAILED',
          message: error.message,
        },
      });
    }
  }
);

export default router;

