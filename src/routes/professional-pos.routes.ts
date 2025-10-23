import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import CashManagementService from '../services/cash-management.service';
import DiscountOverrideService from '../services/discount-override.service';
import ReturnsExchangesService from '../services/returns-exchanges.service';
import PriceBookService from '../services/pricebook.service';
import CustomerCreditService from '../services/customer-credit.service';
import PLUBarcodeService from '../services/plu-barcode.service';
import POSReportsService from '../services/pos-reports.service';
import {
  createCashEventSchema,
  validateDiscountSchema,
  approveOverrideSchema,
  lookupSaleSchema,
  processRefundSchema,
  processExchangeSchema,
  createPriceBookSchema,
  addPriceBookItemSchema,
  createCouponSchema,
  applyCouponSchema,
  quickAddCustomerSchema,
  addStoreCreditSchema,
  useStoreCreditSchema,
  issueGiftCardSchema,
  redeemGiftCardSchema,
  checkGiftCardBalanceSchema,
  addBarcodeAliasSchema,
  addPLUCodeSchema,
  searchByPLUSchema,
  calculateWeightedPriceSchema,
  topItemsQuerySchema,
  discountLeakageQuerySchema,
  salesByHourQuerySchema,
} from '../validators/professional-pos.validator';

const router = Router();

// ===== CASH MANAGEMENT ROUTES =====

/**
 * POST /professional-pos/cash-events
 * Record a cash event (Paid In, Paid Out, No Sale)
 */
router.post(
  '/cash-events',
  authenticateToken,
  validateBody(createCashEventSchema),
  async (req: AuthRequest, res, next) => {
    try {
      let result;
      const context = {
        actorId: req.user!.id,
        actorRole: req.user!.role as UserRole,
      };

      if (req.body.type === 'PAID_IN') {
        result = await CashManagementService.paidIn(req.body, context);
      } else if (req.body.type === 'PAID_OUT') {
        result = await CashManagementService.paidOut(req.body, context);
      } else if (req.body.type === 'NO_SALE') {
        result = await CashManagementService.noSale({
          session_id: req.body.session_id,
          reason: req.body.reason,
        }, context);
      }

      res.status(201).json({
        success: true,
        data: result,
        message: 'Cash event recorded successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /professional-pos/cash-events/:sessionId
 * Get all cash events for a session
 */
router.get(
  '/cash-events/:sessionId',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const events = await CashManagementService.getCashEvents(
        req.params.sessionId,
        req.user!.role as UserRole
      );

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /professional-pos/reports/z-report/:sessionId
 * Generate Z-Report (End of Day)
 */
router.get(
  '/reports/z-report/:sessionId',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const report = await CashManagementService.generateZReport(
        req.params.sessionId,
        req.user!.role as UserRole
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /professional-pos/reports/x-report/:sessionId
 * Generate X-Report (Mid-Day)
 */
router.get(
  '/reports/x-report/:sessionId',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const report = await CashManagementService.generateXReport(
        req.params.sessionId,
        req.user!.role as UserRole
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===== DISCOUNT & OVERRIDE ROUTES =====

/**
 * GET /professional-pos/discounts/caps
 * Get discount caps for current user
 */
router.get(
  '/discounts/caps',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const caps = await DiscountOverrideService.getDiscountCaps(req.user!.id);

      res.json({
        success: true,
        data: caps,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /professional-pos/discounts/validate
 * Validate if a discount is allowed
 */
router.post(
  '/discounts/validate',
  authenticateToken,
  validateBody(validateDiscountSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await DiscountOverrideService.validateDiscount(req.body);

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
 * POST /professional-pos/overrides/approve
 * Approve a manager override with PIN
 */
router.post(
  '/overrides/approve',
  authenticateToken,
  validateBody(approveOverrideSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { approver_username, approver_pin, ...requestData } = req.body;
      
      const override = await DiscountOverrideService.approveOverride(
        { override_id: '', approver_username, approver_pin },
        requestData
      );

      res.status(201).json({
        success: true,
        data: override,
        message: 'Override approved successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /professional-pos/overrides/:sessionId
 * Get override history for a session
 */
router.get(
  '/overrides/:sessionId',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const overrides = await DiscountOverrideService.getOverrides(
        req.params.sessionId,
        req.user!.role as UserRole
      );

      res.json({
        success: true,
        data: overrides,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===== RETURNS & EXCHANGES ROUTES =====

/**
 * POST /professional-pos/sales/lookup
 * Lookup a sale by transaction number or barcode
 */
router.post(
  '/sales/lookup',
  authenticateToken,
  validateBody(lookupSaleSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const transaction = await ReturnsExchangesService.lookupSale(
        req.body,
        req.user!.role as UserRole
      );

      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /professional-pos/sales/refund
 * Process a refund
 */
router.post(
  '/sales/refund',
  authenticateToken,
  validateBody(processRefundSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const refund = await ReturnsExchangesService.processRefund(req.body, {
        actorId: req.user!.id,
        actorRole: req.user!.role as UserRole,
      });

      res.status(201).json({
        success: true,
        data: refund,
        message: 'Refund processed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /professional-pos/sales/exchange
 * Process an exchange
 */
router.post(
  '/sales/exchange',
  authenticateToken,
  validateBody(processExchangeSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const exchange = await ReturnsExchangesService.processExchange(req.body, {
        actorId: req.user!.id,
        actorRole: req.user!.role as UserRole,
      });

      res.status(201).json({
        success: true,
        data: exchange,
        message: 'Exchange processed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===== PRICE BOOKS & COUPONS ROUTES =====

/**
 * POST /professional-pos/price-books
 * Create a price book
 */
router.post(
  '/price-books',
  authenticateToken,
  validateBody(createPriceBookSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const priceBook = await PriceBookService.createPriceBook(req.body, {
        actorId: req.user!.id,
        actorRole: req.user!.role as UserRole,
      });

      res.status(201).json({
        success: true,
        data: priceBook,
        message: 'Price book created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /professional-pos/price-books
 * List all price books
 */
router.get(
  '/price-books',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const priceBooks = await PriceBookService.listPriceBooks(req.user!.role as UserRole);

      res.json({
        success: true,
        data: priceBooks,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /professional-pos/price-books/active
 * Get active price book
 */
router.get(
  '/price-books/active',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const priceBook = await PriceBookService.getActivePriceBook(
        req.query.store_id as string,
        req.query.terminal_id as string
      );

      res.json({
        success: true,
        data: priceBook,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /professional-pos/price-books/items
 * Add item to price book
 */
router.post(
  '/price-books/items',
  authenticateToken,
  validateBody(addPriceBookItemSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const item = await PriceBookService.addPriceBookItem(req.body, {
        actorId: req.user!.id,
        actorRole: req.user!.role as UserRole,
      });

      res.status(201).json({
        success: true,
        data: item,
        message: 'Price book item added successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /professional-pos/coupons
 * Create a coupon
 */
router.post(
  '/coupons',
  authenticateToken,
  validateBody(createCouponSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const coupon = await PriceBookService.createCoupon(req.body, {
        actorId: req.user!.id,
        actorRole: req.user!.role as UserRole,
      });

      res.status(201).json({
        success: true,
        data: coupon,
        message: 'Coupon created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /professional-pos/coupons/apply
 * Apply a coupon
 */
router.post(
  '/coupons/apply',
  authenticateToken,
  validateBody(applyCouponSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await PriceBookService.applyCoupon(req.body);

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
 * GET /professional-pos/coupons
 * List all coupons
 */
router.get(
  '/coupons',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const coupons = await PriceBookService.listCoupons(req.user!.role as UserRole);

      res.json({
        success: true,
        data: coupons,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===== CUSTOMER & CREDIT ROUTES =====

/**
 * POST /professional-pos/customers/quick-add
 * Quick add customer (POS flow)
 */
router.post(
  '/customers/quick-add',
  authenticateToken,
  validateBody(quickAddCustomerSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const customer = await CustomerCreditService.quickAddCustomer(req.body, {
        actorId: req.user!.id,
        actorRole: req.user!.role as UserRole,
      });

      res.status(201).json({
        success: true,
        data: customer,
        message: 'Customer added successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /professional-pos/customers/:id/store-credit
 * Add store credit to customer
 */
router.post(
  '/customers/:id/store-credit',
  authenticateToken,
  validateBody(addStoreCreditSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await CustomerCreditService.addStoreCredit(
        { ...req.body, customer_id: req.params.id },
        {
          actorId: req.user!.id,
          actorRole: req.user!.role as UserRole,
        }
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Store credit added successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /professional-pos/customers/:id/store-credit/use
 * Use store credit
 */
router.post(
  '/customers/:id/store-credit/use',
  authenticateToken,
  validateBody(useStoreCreditSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await CustomerCreditService.useStoreCredit(
        { ...req.body, customer_id: req.params.id },
        {
          actorId: req.user!.id,
          actorRole: req.user!.role as UserRole,
        }
      );

      res.json({
        success: true,
        data: result,
        message: 'Store credit used successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /professional-pos/customers/:id/store-credit
 * Get store credit balance
 */
router.get(
  '/customers/:id/store-credit',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const balance = await CustomerCreditService.getStoreCreditBalance(req.params.id);

      res.json({
        success: true,
        data: { balance },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /professional-pos/customers/:id/store-credit/history
 * Get store credit history
 */
router.get(
  '/customers/:id/store-credit/history',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const history = await CustomerCreditService.getStoreCreditHistory(req.params.id);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /professional-pos/gift-cards
 * Issue a gift card
 */
router.post(
  '/gift-cards',
  authenticateToken,
  validateBody(issueGiftCardSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const giftCard = await CustomerCreditService.issueGiftCard(req.body, {
        actorId: req.user!.id,
        actorRole: req.user!.role as UserRole,
      });

      res.status(201).json({
        success: true,
        data: giftCard,
        message: 'Gift card issued successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /professional-pos/gift-cards/redeem
 * Redeem a gift card
 */
router.post(
  '/gift-cards/redeem',
  authenticateToken,
  validateBody(redeemGiftCardSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await CustomerCreditService.redeemGiftCard(req.body, {
        actorId: req.user!.id,
        actorRole: req.user!.role as UserRole,
      });

      res.json({
        success: true,
        data: result,
        message: 'Gift card redeemed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /professional-pos/gift-cards/check-balance
 * Check gift card balance
 */
router.post(
  '/gift-cards/check-balance',
  authenticateToken,
  validateBody(checkGiftCardBalanceSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await CustomerCreditService.checkGiftCardBalance(req.body.code);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===== PLU & BARCODE ROUTES =====

/**
 * POST /professional-pos/products/barcode-aliases
 * Add barcode alias
 */
router.post(
  '/products/barcode-aliases',
  authenticateToken,
  validateBody(addBarcodeAliasSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const alias = await PLUBarcodeService.addBarcodeAlias(req.body, {
        actorId: req.user!.id,
        actorRole: req.user!.role as UserRole,
      });

      res.status(201).json({
        success: true,
        data: alias,
        message: 'Barcode alias added successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /professional-pos/products/:id/barcode-aliases
 * Get product's barcode aliases
 */
router.get(
  '/products/:id/barcode-aliases',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const aliases = await PLUBarcodeService.getProductAliases(req.params.id);

      res.json({
        success: true,
        data: aliases,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /professional-pos/products/plu-codes
 * Add PLU code
 */
router.post(
  '/products/plu-codes',
  authenticateToken,
  validateBody(addPLUCodeSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const pluCode = await PLUBarcodeService.addPLUCode(req.body, {
        actorId: req.user!.id,
        actorRole: req.user!.role as UserRole,
      });

      res.status(201).json({
        success: true,
        data: pluCode,
        message: 'PLU code added successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /professional-pos/products/search-by-plu
 * Search product by PLU
 */
router.post(
  '/products/search-by-plu',
  authenticateToken,
  validateBody(searchByPLUSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await PLUBarcodeService.searchByPLU(req.body);

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
 * POST /professional-pos/products/calculate-weighted-price
 * Calculate price for weighted item
 */
router.post(
  '/products/calculate-weighted-price',
  authenticateToken,
  validateBody(calculateWeightedPriceSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await PLUBarcodeService.calculateWeightedPrice(req.body);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===== REPORTING ROUTES =====

/**
 * GET /professional-pos/reports/top-items
 * Get top selling items
 */
router.get(
  '/reports/top-items',
  authenticateToken,
  validateQuery(topItemsQuerySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const topItems = await POSReportsService.getTopItems(
        {
          date_from: new Date(req.query.date_from as string),
          date_to: new Date(req.query.date_to as string),
          limit: req.query.limit ? Number(req.query.limit) : undefined,
        },
        req.user!.role as UserRole
      );

      res.json({
        success: true,
        data: topItems,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /professional-pos/reports/discount-leakage
 * Get discount leakage report
 */
router.get(
  '/reports/discount-leakage',
  authenticateToken,
  validateQuery(discountLeakageQuerySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const report = await POSReportsService.getDiscountLeakage(
        {
          date_from: new Date(req.query.date_from as string),
          date_to: new Date(req.query.date_to as string),
          by_cashier: req.query.by_cashier === 'true',
        },
        req.user!.role as UserRole
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /professional-pos/reports/sales-by-hour
 * Get sales by hour
 */
router.get(
  '/reports/sales-by-hour',
  authenticateToken,
  validateQuery(salesByHourQuerySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const report = await POSReportsService.getSalesByHour(
        { date: new Date(req.query.date as string) },
        req.user!.role as UserRole
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /professional-pos/reports/sales-summary
 * Get sales summary
 */
router.get(
  '/reports/sales-summary',
  authenticateToken,
  validateQuery(discountLeakageQuerySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const summary = await POSReportsService.getSalesSummary(
        {
          date_from: new Date(req.query.date_from as string),
          date_to: new Date(req.query.date_to as string),
        },
        req.user!.role as UserRole
      );

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

