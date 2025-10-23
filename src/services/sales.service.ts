import { PrismaClient, UserRole, SalesOrderStatus, InvoiceStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { AuthorizationError, ValidationError, NotFoundError } from '../utils/errors';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

// ===== INTERFACES =====

interface CreateCustomerParams {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  company_name?: string;
  tax_id?: string;
  credit_limit?: number;
  payment_terms?: string;
  discount_percentage?: number;
  is_vip?: boolean;
}

interface UpdateCustomerParams extends Partial<CreateCustomerParams> {
  is_active?: boolean;
}

interface ListCustomersParams {
  q?: string;
  is_active?: boolean;
  is_vip?: boolean;
  page?: number;
  limit?: number;
}

interface CreateSalesOrderParams {
  customer_id: string;
  required_date?: Date;
  shipping_address?: string;
  notes?: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price?: number;
    discount_percentage?: number;
  }[];
}

interface UpdateSalesOrderParams {
  status?: SalesOrderStatus;
  required_date?: Date;
  shipping_address?: string;
  notes?: string;
}

interface ListSalesOrdersParams {
  customer_id?: string;
  status?: SalesOrderStatus;
  date_from?: Date;
  date_to?: Date;
  page?: number;
  limit?: number;
}

interface CreateInvoiceParams {
  sales_order_id?: string;
  customer_id: string;
  due_date: Date;
  notes?: string;
  terms?: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
    discount_percentage?: number;
  }[];
}

interface ProcessPaymentParams {
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  notes?: string;
}

interface StartPOSSessionParams {
  starting_cash: number;
}

interface ProcessPOSTransactionParams {
  session_id: string;
  transaction_type: 'SALE' | 'RETURN' | 'REFUND';
  customer_id?: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
    discount_percentage?: number;
  }[];
  payment_method: PaymentMethod;
  amount_tendered: number;
  notes?: string;
}

// ===== SALES RBAC SERVICE =====

export class SalesRBACService {
  /**
   * Roles that can manage customers
   */
  private static readonly CAN_MANAGE_CUSTOMERS: UserRole[] = [
    UserRole.owner_ultimate_super_admin,
    UserRole.admin,
    UserRole.inventory_manager,
  ];

  /**
   * Roles that can create sales orders
   */
  private static readonly CAN_CREATE_SALES_ORDERS: UserRole[] = [
    UserRole.owner_ultimate_super_admin,
    UserRole.admin,
    UserRole.inventory_manager,
  ];

  /**
   * Roles that can use POS
   */
  private static readonly CAN_USE_POS: UserRole[] = [
    UserRole.owner_ultimate_super_admin,
    UserRole.admin,
    UserRole.cashier,
  ];

  /**
   * Roles that can manage invoices
   */
  private static readonly CAN_MANAGE_INVOICES: UserRole[] = [
    UserRole.owner_ultimate_super_admin,
    UserRole.admin,
  ];

  /**
   * Check if role can manage customers
   */
  static canManageCustomers(role: UserRole): boolean {
    return this.CAN_MANAGE_CUSTOMERS.includes(role);
  }

  /**
   * Check if role can create sales orders
   */
  static canCreateSalesOrders(role: UserRole): boolean {
    return this.CAN_CREATE_SALES_ORDERS.includes(role);
  }

  /**
   * Check if role can use POS
   */
  static canUsePOS(role: UserRole): boolean {
    return this.CAN_USE_POS.includes(role);
  }

  /**
   * Check if role can manage invoices
   */
  static canManageInvoices(role: UserRole): boolean {
    return this.CAN_MANAGE_INVOICES.includes(role);
  }

  /**
   * Enforce customer management permissions
   */
  static enforceCanManageCustomers(role: UserRole): void {
    if (!this.canManageCustomers(role)) {
      throw new AuthorizationError('Insufficient permissions to manage customers');
    }
  }

  /**
   * Enforce sales order creation permissions
   */
  static enforceCanCreateSalesOrders(role: UserRole): void {
    if (!this.canCreateSalesOrders(role)) {
      throw new AuthorizationError('Insufficient permissions to create sales orders');
    }
  }

  /**
   * Enforce POS usage permissions
   */
  static enforceCanUsePOS(role: UserRole): void {
    if (!this.canUsePOS(role)) {
      throw new AuthorizationError('Insufficient permissions to use POS system');
    }
  }

  /**
   * Enforce invoice management permissions
   */
  static enforceCanManageInvoices(role: UserRole): void {
    if (!this.canManageInvoices(role)) {
      throw new AuthorizationError('Insufficient permissions to manage invoices');
    }
  }
}

// ===== SALES SERVICE =====

export class SalesService {
  /**
   * Generate customer number
   */
  private static async generateCustomerNumber(): Promise<string> {
    const count = await prisma.customer.count();
    return `CUST-${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Generate sales order number
   */
  private static async generateSalesOrderNumber(): Promise<string> {
    const count = await prisma.salesOrder.count();
    return `SO-${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Generate invoice number
   */
  private static async generateInvoiceNumber(): Promise<string> {
    const count = await prisma.invoice.count();
    return `INV-${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Generate payment number
   */
  private static async generatePaymentNumber(): Promise<string> {
    const count = await prisma.payment.count();
    return `PAY-${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Generate POS session number
   */
  private static async generatePOSSessionNumber(): Promise<string> {
    const count = await prisma.pOSSession.count();
    return `POS-${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Generate POS transaction number
   */
  private static async generatePOSTransactionNumber(): Promise<string> {
    const count = await prisma.pOSTransaction.count();
    return `TXN-${String(count + 1).padStart(6, '0')}`;
  }

  // ===== CUSTOMER MANAGEMENT =====

  /**
   * Create a new customer
   */
  static async createCustomer(
    params: CreateCustomerParams,
    context: { actorId: string; actorRole: UserRole }
  ): Promise<any> {
    // Enforce RBAC
    SalesRBACService.enforceCanManageCustomers(context.actorRole);

    // Generate customer number
    const customer_number = await this.generateCustomerNumber();

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        customer_number,
        ...params,
        created_by_id: context.actorId,
      },
    });

    // Audit log
    await AuditService.createLog({
      actorUserId: context.actorId,
      action: 'CREATE_CUSTOMER',
      metadata: { customer_id: customer.id, customer_number: customer.customer_number },
    });

    return customer;
  }

  /**
   * List customers with RBAC enforcement
   */
  static async listCustomers(
    actorRole: UserRole,
    params: ListCustomersParams
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Enforce RBAC
    SalesRBACService.enforceCanManageCustomers(actorRole);

    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Search query
    if (params.q) {
      where.OR = [
        { first_name: { contains: params.q, mode: 'insensitive' } },
        { last_name: { contains: params.q, mode: 'insensitive' } },
        { email: { contains: params.q, mode: 'insensitive' } },
        { company_name: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    // Filters
    if (params.is_active !== undefined) {
      where.is_active = params.is_active;
    }

    if (params.is_vip !== undefined) {
      where.is_vip = params.is_vip;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          created_by: {
            select: { id: true, username: true, display_name: true },
          },
          _count: {
            select: {
              sales_orders: true,
              invoices: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get customer by ID
   */
  static async getCustomerById(
    customerId: string,
    actorRole: UserRole
  ): Promise<any> {
    // Enforce RBAC
    SalesRBACService.enforceCanManageCustomers(actorRole);

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        created_by: {
          select: { id: true, username: true, display_name: true },
        },
        sales_orders: {
          take: 5,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            order_number: true,
            status: true,
            total_amount: true,
            order_date: true,
          },
        },
        invoices: {
          take: 5,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            invoice_number: true,
            status: true,
            total_amount: true,
            invoice_date: true,
          },
        },
        _count: {
          select: {
            sales_orders: true,
            invoices: true,
            payments: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return customer;
  }

  /**
   * Update customer
   */
  static async updateCustomer(
    customerId: string,
    params: UpdateCustomerParams,
    context: { actorId: string; actorRole: UserRole }
  ): Promise<any> {
    // Enforce RBAC
    SalesRBACService.enforceCanManageCustomers(context.actorRole);

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      throw new NotFoundError('Customer not found');
    }

    // Update customer
    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: params,
      include: {
        created_by: {
          select: { id: true, username: true, display_name: true },
        },
      },
    });

    // Audit log
    await AuditService.createLog({
      actorUserId: context.actorId,
      action: 'UPDATE_CUSTOMER',
      metadata: { customer_id: customer.id, customer_number: customer.customer_number },
    });

    return customer;
  }

  // ===== SALES ORDERS =====

  /**
   * Create a new sales order
   */
  static async createSalesOrder(
    params: CreateSalesOrderParams,
    context: { actorId: string; actorRole: UserRole }
  ): Promise<any> {
    // Enforce RBAC
    SalesRBACService.enforceCanCreateSalesOrders(context.actorRole);

    // Validate customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: params.customer_id },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Validate products and calculate totals
    let subtotal = 0;
    const items = [];

    for (const item of params.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.product_id },
      });

      if (!product) {
        throw new NotFoundError(`Product not found: ${item.product_id}`);
      }

      if (product.stock_quantity < item.quantity) {
        throw new ValidationError(`Insufficient stock for product: ${product.name}. Available: ${product.stock_quantity}, Required: ${item.quantity}`);
      }

      const unitPrice = item.unit_price || Number(product.price);
      const discountPercent = item.discount_percentage || 0;
      const lineTotal = item.quantity * unitPrice * (1 - discountPercent / 100);

      items.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        discount_percentage: discountPercent,
        line_total: lineTotal,
      });

      subtotal += lineTotal;
    }

    // Generate order number
    const order_number = await this.generateSalesOrderNumber();

    // Create sales order with items
    const salesOrder = await prisma.salesOrder.create({
      data: {
        order_number,
        customer_id: params.customer_id,
        status: SalesOrderStatus.DRAFT,
        total_amount: subtotal,
        final_amount: subtotal,
        required_date: params.required_date,
        shipping_address: params.shipping_address,
        notes: params.notes,
        created_by_id: context.actorId,
        items: {
          create: items,
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                stock_quantity: true,
              },
            },
          },
        },
        created_by: {
          select: { id: true, username: true, display_name: true },
        },
      },
    });

    // Audit log
    await AuditService.createLog({
      actorUserId: context.actorId,
      action: 'CREATE_SALES_ORDER',
      metadata: { 
        sales_order_id: salesOrder.id, 
        order_number: salesOrder.order_number,
        customer_id: params.customer_id,
        total_amount: subtotal,
      },
    });

    return salesOrder;
  }

  /**
   * List sales orders
   */
  static async listSalesOrders(
    actorRole: UserRole,
    params: ListSalesOrdersParams
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Enforce RBAC
    SalesRBACService.enforceCanCreateSalesOrders(actorRole);

    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filters
    if (params.customer_id) {
      where.customer_id = params.customer_id;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.date_from || params.date_to) {
      where.order_date = {};
      if (params.date_from) {
        where.order_date.gte = params.date_from;
      }
      if (params.date_to) {
        where.order_date.lte = params.date_to;
      }
    }

    const [salesOrders, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        include: {
          customer: {
            select: { id: true, customer_number: true, first_name: true, last_name: true, company_name: true },
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
          created_by: {
            select: { id: true, username: true, display_name: true },
          },
          _count: {
            select: {
              items: true,
              invoices: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.salesOrder.count({ where }),
    ]);

    return {
      data: salesOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get sales order by ID
   */
  static async getSalesOrderById(
    orderId: string,
    actorRole: UserRole
  ): Promise<any> {
    // Enforce RBAC
    SalesRBACService.enforceCanCreateSalesOrders(actorRole);

    const salesOrder = await prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        invoices: {
          include: {
            payments: true,
          },
        },
        created_by: {
          select: { id: true, username: true, display_name: true },
        },
      },
    });

    if (!salesOrder) {
      throw new NotFoundError('Sales order not found');
    }

    return salesOrder;
  }

  /**
   * Update sales order status
   */
  static async updateSalesOrder(
    orderId: string,
    params: UpdateSalesOrderParams,
    context: { actorId: string; actorRole: UserRole }
  ): Promise<any> {
    // Enforce RBAC
    SalesRBACService.enforceCanCreateSalesOrders(context.actorRole);

    // Check if order exists
    const existingOrder = await prisma.salesOrder.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      throw new NotFoundError('Sales order not found');
    }

    // Update sales order
    const salesOrder = await prisma.salesOrder.update({
      where: { id: orderId },
      data: params,
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        created_by: {
          select: { id: true, username: true, display_name: true },
        },
      },
    });

    // If status is confirmed, update stock
    if (params.status === SalesOrderStatus.CONFIRMED) {
      for (const item of salesOrder.items) {
        // Update product stock
        await prisma.product.update({
          where: { id: item.product_id },
          data: {
            stock_quantity: {
              decrement: item.quantity,
            },
          },
        });

        // Create stock movement record
        await prisma.stockMovement.create({
          data: {
            product_id: item.product_id,
            movement_type: 'OUT',
            quantity: item.quantity,
            reference_number: salesOrder.order_number,
            reason: `Sale via order ${salesOrder.order_number}`,
            performed_by_id: context.actorId,
          },
        });
      }
    }

    // Audit log
    await AuditService.createLog({
      actorUserId: context.actorId,
      action: 'UPDATE_SALES_ORDER',
      metadata: { 
        sales_order_id: salesOrder.id, 
        order_number: salesOrder.order_number,
        status: params.status,
      },
    });

    return salesOrder;
  }

  // ===== POS SYSTEM =====

  /**
   * Start POS session
   */
  static async startPOSSession(
    params: StartPOSSessionParams,
    context: { actorId: string; actorRole: UserRole }
  ): Promise<any> {
    // Enforce RBAC
    SalesRBACService.enforceCanUsePOS(context.actorRole);

    // Check if cashier has active session
    const activeSession = await prisma.pOSSession.findFirst({
      where: {
        cashier_id: context.actorId,
        status: 'ACTIVE',
      },
    });

    if (activeSession) {
      throw new ValidationError('Cashier already has an active POS session');
    }

    // Generate session number
    const session_number = await this.generatePOSSessionNumber();

    // Create POS session
    const session = await prisma.pOSSession.create({
      data: {
        session_number,
        cashier_id: context.actorId,
        status: 'ACTIVE',
        starting_cash: params.starting_cash,
      },
      include: {
        cashier: {
          select: { id: true, username: true, display_name: true },
        },
      },
    });

    // Audit log
    await AuditService.createLog({
      actorUserId: context.actorId,
      action: 'START_POS_SESSION',
      metadata: { 
        session_id: session.id, 
        session_number: session.session_number,
        starting_cash: params.starting_cash,
      },
    });

    return session;
  }

  /**
   * End POS session
   */
  static async endPOSSession(
    sessionId: string,
    endingCash: number,
    context: { actorId: string; actorRole: UserRole }
  ): Promise<any> {
    // Enforce RBAC
    SalesRBACService.enforceCanUsePOS(context.actorRole);

    // Check if session exists and belongs to cashier
    const session = await prisma.pOSSession.findFirst({
      where: {
        id: sessionId,
        cashier_id: context.actorId,
        status: 'ACTIVE',
      },
    });

    if (!session) {
      throw new NotFoundError('Active POS session not found');
    }

    // Update session
    const updatedSession = await prisma.pOSSession.update({
      where: { id: sessionId },
      data: {
        status: 'CLOSED',
        ending_cash: endingCash,
        end_time: new Date(),
      },
      include: {
        cashier: {
          select: { id: true, username: true, display_name: true },
        },
        transactions: {
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, name: true, sku: true },
                },
              },
            },
          },
        },
      },
    });

    // Audit log
    await AuditService.createLog({
      actorUserId: context.actorId,
      action: 'END_POS_SESSION',
      metadata: { 
        session_id: session.id, 
        session_number: session.session_number,
        ending_cash: endingCash,
        total_sales: updatedSession.total_sales,
        total_transactions: updatedSession.total_transactions,
      },
    });

    return updatedSession;
  }

  /**
   * Process POS transaction
   */
  static async processPOSTransaction(
    params: ProcessPOSTransactionParams,
    context: { actorId: string; actorRole: UserRole }
  ): Promise<any> {
    // Enforce RBAC
    SalesRBACService.enforceCanUsePOS(context.actorRole);

    // Check if session exists and belongs to cashier
    const session = await prisma.pOSSession.findFirst({
      where: {
        id: params.session_id,
        cashier_id: context.actorId,
        status: 'ACTIVE',
      },
    });

    if (!session) {
      throw new NotFoundError('Active POS session not found');
    }

    // Validate products and calculate totals
    let subtotal = 0;
    const items = [];

    for (const item of params.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.product_id },
      });

      if (!product) {
        throw new NotFoundError(`Product not found: ${item.product_id}`);
      }

      if (params.transaction_type === 'SALE' && product.stock_quantity < item.quantity) {
        throw new ValidationError(`Insufficient stock for product: ${product.name}. Available: ${product.stock_quantity}, Required: ${item.quantity}`);
      }

      const unitPrice = item.unit_price;
      const discountPercent = item.discount_percentage || 0;
      const lineTotal = item.quantity * unitPrice * (1 - discountPercent / 100);

      items.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        discount_percentage: discountPercent,
        line_total: lineTotal,
      });

      subtotal += lineTotal;
    }

    const taxAmount = 0; // TODO: Implement tax calculation
    const discountAmount = 0; // TODO: Implement discount calculation
    const totalAmount = subtotal + taxAmount - discountAmount;
    const changeAmount = Math.max(0, params.amount_tendered - totalAmount);

    // Generate transaction number
    const transaction_number = await this.generatePOSTransactionNumber();

    // Create transaction with items
    const transaction = await prisma.pOSTransaction.create({
      data: {
        transaction_number,
        session_id: params.session_id,
        transaction_type: params.transaction_type,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        payment_method: params.payment_method,
        amount_tendered: params.amount_tendered,
        change_amount: changeAmount,
        customer_id: params.customer_id,
        notes: params.notes,
        items: {
          create: items,
        },
      },
      include: {
        session: {
          include: {
            cashier: {
              select: { id: true, username: true, display_name: true },
            },
          },
        },
        customer: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                stock_quantity: true,
              },
            },
          },
        },
      },
    });

    // Update session totals
    await prisma.pOSSession.update({
      where: { id: params.session_id },
      data: {
        total_sales: {
          increment: params.transaction_type === 'SALE' ? totalAmount : -totalAmount,
        },
        total_transactions: {
          increment: 1,
        },
      },
    });

    // Update stock for sales
    if (params.transaction_type === 'SALE') {
      for (const item of params.items) {
        // Update product stock
        await prisma.product.update({
          where: { id: item.product_id },
          data: {
            stock_quantity: {
              decrement: item.quantity,
            },
          },
        });

        // Create stock movement record
        await prisma.stockMovement.create({
          data: {
            product_id: item.product_id,
            movement_type: 'OUT',
            quantity: item.quantity,
            reference_number: transaction_number,
            reason: `Sale via POS transaction ${transaction_number}`,
            performed_by_id: context.actorId,
          },
        });
      }
    } else if (params.transaction_type === 'RETURN') {
      for (const item of params.items) {
        // Update product stock
        await prisma.product.update({
          where: { id: item.product_id },
          data: {
            stock_quantity: {
              increment: item.quantity,
            },
          },
        });

        // Create stock movement record
        await prisma.stockMovement.create({
          data: {
            product_id: item.product_id,
            movement_type: 'RETURN',
            quantity: item.quantity,
            reference_number: transaction_number,
            reason: `Return via POS transaction ${transaction_number}`,
            performed_by_id: context.actorId,
          },
        });
      }
    }

    // Audit log
    await AuditService.createLog({
      actorUserId: context.actorId,
      action: 'PROCESS_SALE',
      metadata: { 
        transaction_id: transaction.id, 
        transaction_number: transaction_number,
        transaction_type: params.transaction_type,
        total_amount: totalAmount,
        session_id: params.session_id,
      },
    });

    return transaction;
  }

  /**
   * Get POS session by ID
   */
  static async getPOSSessionById(
    sessionId: string,
    actorRole: UserRole
  ): Promise<any> {
    // Enforce RBAC
    SalesRBACService.enforceCanUsePOS(actorRole);

    const session = await prisma.pOSSession.findUnique({
      where: { id: sessionId },
      include: {
        cashier: {
          select: { id: true, username: true, display_name: true },
        },
        transactions: {
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, name: true, sku: true },
                },
              },
            },
          },
          orderBy: { transaction_date: 'desc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundError('POS session not found');
    }

    return session;
  }

  /**
   * List POS sessions
   */
  static async listPOSSessions(
    actorRole: UserRole,
    cashierId?: string,
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Enforce RBAC
    SalesRBACService.enforceCanUsePOS(actorRole);

    const skip = (page - 1) * limit;
    const where: any = {};

    if (cashierId) {
      where.cashier_id = cashierId;
    }

    if (status) {
      where.status = status;
    }

    const [sessions, total] = await Promise.all([
      prisma.pOSSession.findMany({
        where,
        include: {
          cashier: {
            select: { id: true, username: true, display_name: true },
          },
          _count: {
            select: {
              transactions: true,
            },
          },
        },
        orderBy: { start_time: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pOSSession.count({ where }),
    ]);

    return {
      data: sessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ===== INVOICES =====

  /**
   * Create invoice from sales order or standalone
   */
  static async createInvoice(
    params: CreateInvoiceParams,
    context: { actorId: string; actorRole: UserRole }
  ): Promise<any> {
    // Enforce RBAC
    SalesRBACService.enforceCanManageInvoices(context.actorRole);

    // Validate customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: params.customer_id },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Validate sales order if provided
    let salesOrder = null;
    if (params.sales_order_id) {
      salesOrder = await prisma.salesOrder.findUnique({
        where: { id: params.sales_order_id },
      });

      if (!salesOrder) {
        throw new NotFoundError('Sales order not found');
      }
    }

    // Validate products and calculate totals
    let subtotal = 0;
    const items = [];

    for (const item of params.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.product_id },
      });

      if (!product) {
        throw new NotFoundError(`Product not found: ${item.product_id}`);
      }

      const unitPrice = item.unit_price;
      const discountPercent = item.discount_percentage || 0;
      const lineTotal = item.quantity * unitPrice * (1 - discountPercent / 100);

      items.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        discount_percentage: discountPercent,
        line_total: lineTotal,
      });

      subtotal += lineTotal;
    }

    const taxAmount = 0; // TODO: Implement tax calculation
    const discountAmount = 0; // TODO: Implement discount calculation
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Generate invoice number
    const invoice_number = await this.generateInvoiceNumber();

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoice_number,
        customer_id: params.customer_id,
        sales_order_id: params.sales_order_id,
        status: InvoiceStatus.DRAFT,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        balance_amount: totalAmount,
        due_date: params.due_date,
        notes: params.notes,
        terms: params.terms,
        created_by_id: context.actorId,
      },
    });

    // Audit log
    await AuditService.createLog({
      actorUserId: context.actorId,
      action: 'CREATE_INVOICE',
      metadata: { 
        invoice_id: invoice.id, 
        invoice_number: invoice.invoice_number,
        customer_id: params.customer_id,
        sales_order_id: params.sales_order_id,
        total_amount: totalAmount,
      },
    });

    return invoice;
  }

  /**
   * Process payment for invoice
   */
  static async processPayment(
    params: ProcessPaymentParams,
    context: { actorId: string; actorRole: UserRole }
  ): Promise<any> {
    // Enforce RBAC
    SalesRBACService.enforceCanManageInvoices(context.actorRole);

    // Validate invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.invoice_id },
      include: { customer: true },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    // Check if payment amount is valid
    const remainingBalance = Number(invoice.balance_amount);
    if (params.amount > remainingBalance) {
      throw new ValidationError(`Payment amount (${params.amount}) exceeds remaining balance (${remainingBalance})`);
    }

    // Generate payment number
    const payment_number = await this.generatePaymentNumber();

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        payment_number,
        invoice_id: params.invoice_id,
        customer_id: invoice.customer_id,
        amount: params.amount,
        payment_method: params.payment_method,
        status: PaymentStatus.COMPLETED,
        reference_number: params.reference_number,
        notes: params.notes,
        processed_by_id: context.actorId,
      },
    });

    // Update invoice
    const newPaidAmount = Number(invoice.paid_amount) + params.amount;
    const newBalanceAmount = Number(invoice.balance_amount) - params.amount;
    const newStatus = newBalanceAmount <= 0 ? InvoiceStatus.PAID : InvoiceStatus.SENT;

    await prisma.invoice.update({
      where: { id: params.invoice_id },
      data: {
        paid_amount: newPaidAmount,
        balance_amount: newBalanceAmount,
        status: newStatus,
        paid_date: newBalanceAmount <= 0 ? new Date() : invoice.paid_date,
      },
    });

    // Audit log
    await AuditService.createLog({
      actorUserId: context.actorId,
      action: 'PROCESS_PAYMENT',
      metadata: { 
        payment_id: payment.id, 
        payment_number: payment_number,
        invoice_id: params.invoice_id,
        amount: params.amount,
        payment_method: params.payment_method,
      },
    });

    return payment;
  }

  /**
   * Get sales statistics for dashboard
   */
  static async getSalesStatistics(actorRole: UserRole): Promise<any> {
    // Enforce RBAC - only admin and owner can see sales stats
    const allowedRoles: UserRole[] = [UserRole.owner_ultimate_super_admin, UserRole.admin];
    if (!allowedRoles.includes(actorRole)) {
      throw new AuthorizationError('Insufficient permissions to view sales statistics');
    }

    const [
      totalCustomers,
      activeCustomers,
      totalSalesOrders,
      pendingSalesOrders,
      totalInvoices,
      unpaidInvoices,
      totalRevenue,
      todayRevenue,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { is_active: true } }),
      prisma.salesOrder.count(),
      prisma.salesOrder.count({ where: { status: SalesOrderStatus.DRAFT } }),
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] } } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.COMPLETED },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: PaymentStatus.COMPLETED,
          payment_date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      total_customers: totalCustomers,
      active_customers: activeCustomers,
      total_sales_orders: totalSalesOrders,
      pending_sales_orders: pendingSalesOrders,
      total_invoices: totalInvoices,
      unpaid_invoices: unpaidInvoices,
      total_revenue: Number(totalRevenue._sum.amount || 0),
      today_revenue: Number(todayRevenue._sum.amount || 0),
    };
  }
}
