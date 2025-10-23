import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import ReceiptService from '../services/receipt.service';
import AnalyticsService from '../services/analytics.service';
import {
  generateReceiptSchema,
  reprintReceiptSchema,
  emailReceiptSchema,
  updatePrintSettingsSchema,
  dateRangeSchema,
} from '../validators/receipt-analytics.validator';

const router = express.Router();

// ===== RECEIPT ROUTES =====

/**
 * @route   POST /receipts/generate
 * @desc    Generate receipt for a transaction
 * @access  Private (Cashier+)
 */
router.post(
  '/receipts/generate',
  authenticateToken,
  validateBody(generateReceiptSchema),
  async (req, res, next) => {
    try {
      const result = await ReceiptService.generateReceipt(
        req.body,
        (req as any).user.role
      );
      
      res.json({
        success: true,
        data: result,
        message: 'Receipt generated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /receipts/reprint
 * @desc    Reprint an existing receipt
 * @access  Private (Cashier+)
 */
router.post(
  '/receipts/reprint',
  authenticateToken,
  validateBody(reprintReceiptSchema),
  async (req, res, next) => {
    try {
      const result = await ReceiptService.reprintReceipt(
        {
          receipt_id: req.body.receipt_id,
          actor_id: (req as any).user.id,
        },
        (req as any).user.role
      );
      
      res.json({
        success: true,
        data: result,
        message: 'Receipt reprinted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /receipts/transaction/:transactionId
 * @desc    Get receipt by transaction ID
 * @access  Private
 */
router.get(
  '/receipts/transaction/:transactionId',
  authenticateToken,
  async (req, res, next) => {
    try {
      const result = await ReceiptService.getReceiptByTransaction(
        req.params.transactionId
      );
      
      if (!result) {
        res.status(404).json({
          success: false,
          error: { message: 'Receipt not found' },
        });
        return;
      }
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /receipts/number/:receiptNumber
 * @desc    Get receipt by receipt number
 * @access  Private
 */
router.get(
  '/receipts/number/:receiptNumber',
  authenticateToken,
  async (req, res, next) => {
    try {
      const result = await ReceiptService.getReceiptByNumber(
        req.params.receiptNumber
      );
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /receipts/email
 * @desc    Email receipt to customer
 * @access  Private (Cashier+)
 */
router.post(
  '/receipts/email',
  authenticateToken,
  validateBody(emailReceiptSchema),
  async (req, res, next) => {
    try {
      const result = await ReceiptService.emailReceipt(
        req.body.receipt_id,
        req.body.email_address
      );
      
      res.json({
        success: true,
        data: result,
        message: 'Receipt emailed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /receipts/html/:receiptId
 * @desc    Get HTML version of receipt for printing
 * @access  Private
 */
router.get(
  '/receipts/html/:receiptId',
  authenticateToken,
  async (req, res, next) => {
    try {
      const result = await ReceiptService.reprintReceipt(
        {
          receipt_id: req.params.receiptId,
          actor_id: (req as any).user.id,
        },
        (req as any).user.role
      );
      
      const html = ReceiptService.generateHTMLReceipt(result.receipt_data);
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      next(error);
    }
  }
);

// ===== PRINT SETTINGS ROUTES =====

/**
 * @route   GET /settings/print
 * @desc    Get print settings (default or specific)
 * @access  Private
 */
router.get(
  '/settings/print',
  authenticateToken,
  async (req, res, next) => {
    try {
      const settingsId = req.query.id as string | undefined;
      const settings = await ReceiptService.getPrintSettings(settingsId);
      
      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /settings/print/:id
 * @desc    Update print settings
 * @access  Private (Admin+)
 */
router.put(
  '/settings/print/:id',
  authenticateToken,
  validateBody(updatePrintSettingsSchema),
  async (req, res, next) => {
    try {
      const settings = await ReceiptService.updatePrintSettings(
        req.params.id,
        req.body,
        (req as any).user.role
      );
      
      res.json({
        success: true,
        data: settings,
        message: 'Print settings updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===== ANALYTICS ROUTES =====

/**
 * @route   POST /analytics/sales
 * @desc    Get comprehensive sales analytics
 * @access  Private (Admin+)
 */
router.post(
  '/analytics/sales',
  authenticateToken,
  validateBody(dateRangeSchema),
  async (req, res, next) => {
    try {
      const analytics = await AnalyticsService.getSalesAnalytics(
        {
          date_from: new Date(req.body.date_from),
          date_to: new Date(req.body.date_to),
        },
        (req as any).user.role
      );
      
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /analytics/dashboard
 * @desc    Get dashboard quick stats
 * @access  Private (Cashier+)
 */
router.get(
  '/analytics/dashboard',
  authenticateToken,
  async (req, res, next) => {
    try {
      const stats = await AnalyticsService.getDashboardStats(
        (req as any).user.role
      );
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /analytics/trend
 * @desc    Get sales trend data for charts
 * @access  Private (Admin+)
 */
router.get(
  '/analytics/trend',
  authenticateToken,
  async (req, res, next) => {
    try {
      const { date_from, date_to, period } = req.query;
      
      if (!date_from || !date_to || !period) {
        res.status(400).json({
          success: false,
          error: { message: 'date_from, date_to, and period are required' },
        });
        return;
      }
      
      const trendData = await AnalyticsService.getSalesTrend(
        {
          date_from: new Date(date_from as string),
          date_to: new Date(date_to as string),
        },
        period as 'hour' | 'day' | 'week' | 'month',
        (req as any).user.role
      );
      
      res.json({
        success: true,
        data: trendData,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /analytics/products
 * @desc    Get product performance analysis
 * @access  Private (Admin+)
 */
router.get(
  '/analytics/products',
  authenticateToken,
  async (req, res, next) => {
    try {
      const { date_from, date_to } = req.query;
      
      if (!date_from || !date_to) {
        res.status(400).json({
          success: false,
          error: { message: 'date_from and date_to are required' },
        });
        return;
      }
      
      const performance = await AnalyticsService.getProductPerformance(
        {
          date_from: new Date(date_from as string),
          date_to: new Date(date_to as string),
        },
        (req as any).user.role
      );
      
      res.json({
        success: true,
        data: performance,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /analytics/categories
 * @desc    Get category performance analysis
 * @access  Private (Admin+)
 */
router.get(
  '/analytics/categories',
  authenticateToken,
  async (req, res, next) => {
    try {
      const { date_from, date_to } = req.query;
      
      if (!date_from || !date_to) {
        res.status(400).json({
          success: false,
          error: { message: 'date_from and date_to are required' },
        });
        return;
      }
      
      const performance = await AnalyticsService.getCategoryPerformance(
        {
          date_from: new Date(date_from as string),
          date_to: new Date(date_to as string),
        },
        (req as any).user.role
      );
      
      res.json({
        success: true,
        data: performance,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

