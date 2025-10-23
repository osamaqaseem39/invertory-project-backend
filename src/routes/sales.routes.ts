import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { SalesService } from '../services/sales.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersQuerySchema,
  createSalesOrderSchema,
  updateSalesOrderSchema,
  listSalesOrdersQuerySchema,
  createInvoiceSchema,
  processPaymentSchema,
  startPOSSessionSchema,
  endPOSSessionSchema,
  processPOSTransactionSchema,
  listPOSSessionsQuerySchema,
} from '../validators/sales.validator';

const router = Router();

// ===== CUSTOMER ROUTES =====

/**
 * POST /customers
 * Create a new customer
 */
router.post(
  '/customers',
  authenticateToken,
  validateBody(createCustomerSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const customer = await SalesService.createCustomer(req.body, {
        actorId: req.user!.id,
        actorRole: req.user!.role as UserRole,
      });

      res.status(201).json({
        success: true,
        data: customer,
        message: 'Customer created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /customers
 * List customers with filters
 */
router.get(
  '/customers',
  authenticateToken,
  validateQuery(listCustomersQuerySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await SalesService.listCustomers(
        req.user!.role as UserRole,
        req.query as any
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /customers/:id
 * Get customer by ID
 */
router.get(
  '/customers/:id',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const customer = await SalesService.getCustomerById(
        req.params.id,
        req.user!.role as UserRole
      );

      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /customers/:id
 * Update customer
 */
router.put(
  '/customers/:id',
  authenticateToken,
  validateBody(updateCustomerSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const customer = await SalesService.updateCustomer(
        req.params.id,
        req.body,
        {
          actorId: req.user!.id,
          actorRole: req.user!.role as UserRole,
        }
      );

      res.json({
        success: true,
        data: customer,
        message: 'Customer updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===== SALES ORDER ROUTES =====

/**
 * POST /sales-orders
 * Create a new sales order
 */
router.post(
  '/sales-orders',
  authenticateToken,
  validateBody(createSalesOrderSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const salesOrder = await SalesService.createSalesOrder(req.body, {
        actorId: req.user!.id,
        actorRole: req.user!.role as UserRole,
      });

      res.status(201).json({
        success: true,
        data: salesOrder,
        message: 'Sales order created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /sales-orders
 * List sales orders with filters
 */
router.get(
  '/sales-orders',
  authenticateToken,
  validateQuery(listSalesOrdersQuerySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await SalesService.listSalesOrders(
        req.user!.role as UserRole,
        req.query as any
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /sales-orders/:id
 * Get sales order by ID
 */
router.get(
  '/sales-orders/:id',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const salesOrder = await SalesService.getSalesOrderById(
        req.params.id,
        req.user!.role as UserRole
      );

      res.json({
        success: true,
        data: salesOrder,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /sales-orders/:id
 * Update sales order
 */
router.put(
  '/sales-orders/:id',
  authenticateToken,
  validateBody(updateSalesOrderSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const salesOrder = await SalesService.updateSalesOrder(
        req.params.id,
        req.body,
        {
          actorId: req.user!.id,
          actorRole: req.user!.role as UserRole,
        }
      );

      res.json({
        success: true,
        data: salesOrder,
        message: 'Sales order updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===== POS ROUTES =====

/**
 * POST /pos/sessions
 * Start a new POS session
 */
router.post(
  '/pos/sessions',
  authenticateToken,
  validateBody(startPOSSessionSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const session = await SalesService.startPOSSession(req.body, {
        actorId: req.user!.id,
        actorRole: req.user!.role as UserRole,
      });

      res.status(201).json({
        success: true,
        data: session,
        message: 'POS session started successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /pos/sessions
 * List POS sessions
 */
router.get(
  '/pos/sessions',
  authenticateToken,
  validateQuery(listPOSSessionsQuerySchema),
  async (req: AuthRequest, res, next) => {
    try {
      const result = await SalesService.listPOSSessions(
        req.user!.role as UserRole,
        req.query.cashier_id as string | undefined,
        req.query.status as string | undefined,
        typeof req.query.page === 'string' ? parseInt(req.query.page) : undefined,
        typeof req.query.limit === 'string' ? parseInt(req.query.limit) : undefined
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /pos/sessions/:id
 * Get POS session by ID
 */
router.get(
  '/pos/sessions/:id',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const session = await SalesService.getPOSSessionById(
        req.params.id,
        req.user!.role as UserRole
      );

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /pos/sessions/:id/end
 * End POS session
 */
router.post(
  '/pos/sessions/:id/end',
  authenticateToken,
  validateBody(endPOSSessionSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const session = await SalesService.endPOSSession(
        req.params.id,
        req.body.ending_cash,
        {
          actorId: req.user!.id,
          actorRole: req.user!.role as UserRole,
        }
      );

      res.json({
        success: true,
        data: session,
        message: 'POS session ended successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /pos/transactions
 * Process POS transaction
 */
router.post(
  '/pos/transactions',
  authenticateToken,
  validateBody(processPOSTransactionSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const transaction = await SalesService.processPOSTransaction(req.body, {
        actorId: req.user!.id,
        actorRole: req.user!.role as UserRole,
      });

      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaction processed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===== INVOICE ROUTES =====

/**
 * POST /invoices
 * Create a new invoice
 */
router.post(
  '/invoices',
  authenticateToken,
  validateBody(createInvoiceSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const invoice = await SalesService.createInvoice(req.body, {
        actorId: req.user!.id,
        actorRole: req.user!.role as UserRole,
      });

      res.status(201).json({
        success: true,
        data: invoice,
        message: 'Invoice created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /payments
 * Process payment for invoice
 */
router.post(
  '/payments',
  authenticateToken,
  validateBody(processPaymentSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const payment = await SalesService.processPayment(req.body, {
        actorId: req.user!.id,
        actorRole: req.user!.role as UserRole,
      });

      res.status(201).json({
        success: true,
        data: payment,
        message: 'Payment processed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===== SALES STATISTICS =====

/**
 * GET /sales/statistics
 * Get sales statistics for dashboard
 */
router.get(
  '/sales/statistics',
  authenticateToken,
  async (req: AuthRequest, res, next) => {
    try {
      const statistics = await SalesService.getSalesStatistics(
        req.user!.role as UserRole
      );

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
