-- SQLite Schema for Inventory Management System
-- Converted from PostgreSQL Prisma schema
-- Phase 1: Database Architecture Migration

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ===== ENUMS (as TEXT with CHECK constraints) =====

-- User roles
-- UserRole: owner_ultimate_super_admin, admin, cashier, inventory_manager, guest

-- Audit actions
-- AuditAction: CREATE_USER, UPDATE_USER, DELETE_USER, LOGIN, LOGOUT, PASSWORD_RESET, ROLE_CHANGE, ACTIVATE_USER, DEACTIVATE_USER, REFRESH_TOKEN, CREATE_PRODUCT, UPDATE_PRODUCT, ARCHIVE_PRODUCT, RESTORE_PRODUCT, CREATE_CATEGORY, UPDATE_CATEGORY, CREATE_SUPPLIER, UPDATE_SUPPLIER, CREATE_PO, APPROVE_PO, RECEIVE_GRN, ADJUST_STOCK, APPROVE_ADJUSTMENT, CREATE_CUSTOMER, UPDATE_CUSTOMER, CREATE_SALES_ORDER, UPDATE_SALES_ORDER, CREATE_INVOICE, PROCESS_PAYMENT, START_POS_SESSION, END_POS_SESSION, PROCESS_SALE, PROCESS_RETURN, PAID_IN, PAID_OUT, NO_SALE, MANAGER_OVERRIDE, APPLY_DISCOUNT, VOID_TRANSACTION, ISSUE_REFUND, PROCESS_EXCHANGE, APPLY_COUPON, REDEEM_GIFT_CARD, ISSUE_GIFT_CARD, ADD_STORE_CREDIT, USE_STORE_CREDIT, REPRINT_RECEIPT, PRICE_OVERRIDE

-- PO Status
-- POStatus: DRAFT, SUBMITTED, APPROVED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED

-- GRN Status
-- GRNStatus: COMPLETE, PARTIAL, WITH_DISCREPANCY

-- Stock Movement Types
-- StockMovementType: IN, OUT, ADJUSTMENT, TRANSFER_OUT, TRANSFER_IN, RETURN, DAMAGE

-- Adjustment Reasons
-- AdjustmentReason: DAMAGE, THEFT, COUNT_ERROR, EXPIRED, LOST, OTHER

-- Adjustment Status
-- AdjustmentStatus: PENDING, APPROVED, REJECTED

-- Sales Order Status
-- SalesOrderStatus: DRAFT, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED

-- Invoice Status
-- InvoiceStatus: DRAFT, SENT, PAID, OVERDUE, CANCELLED, REFUNDED

-- Payment Methods
-- PaymentMethod: CASH, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, CHECK, STORE_CREDIT, OTHER

-- Payment Status
-- PaymentStatus: PENDING, COMPLETED, FAILED, REFUNDED, PARTIALLY_REFUNDED

-- POS Session Status
-- POSSessionStatus: ACTIVE, CLOSED, SUSPENDED

-- Return Status
-- ReturnStatus: PENDING, APPROVED, REJECTED, PROCESSED

-- Return Reasons
-- ReturnReason: DEFECTIVE, WRONG_ITEM, NOT_AS_DESCRIBED, CHANGED_MIND, DUPLICATE_ORDER, OTHER

-- Cash Event Types
-- CashEventType: PAID_IN, PAID_OUT, NO_SALE, CASH_DROP, PETTY_CASH

-- Tax Classes
-- TaxClass: STANDARD, REDUCED, ZERO, EXEMPT

-- Discount Types
-- DiscountType: PERCENT, FLAT

-- Refund Methods
-- RefundMethod: ORIGINAL_PAYMENT, CASH, STORE_CREDIT, GIFT_CARD

-- Pricebook Types
-- PricebookType: BASE, PROMOTIONAL, SEASONAL, CLEARANCE

-- Receipt Status
-- ReceiptStatus: PRINTED, EMAILED, VOIDED

-- OCR Status
-- OCRStatus: PENDING, PROCESSING, COMPLETED, FAILED, REVIEWED

-- OCR Source Types
-- OCRSourceType: RECEIPT, INVOICE, PURCHASE_ORDER, PRICE_LIST

-- ===== TABLES =====

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('owner_ultimate_super_admin', 'admin', 'cashier', 'inventory_manager', 'guest')),
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_by_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    
    -- Professional POS Extensions
    max_line_discount DECIMAL(5,2),
    max_cart_discount DECIMAL(5,2),
    can_approve_overrides BOOLEAN DEFAULT 0,
    
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit logs table
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    actor_user_id TEXT NOT NULL,
    target_user_id TEXT,
    action TEXT NOT NULL CHECK (action IN (
        'CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'LOGIN', 'LOGOUT', 'PASSWORD_RESET', 'ROLE_CHANGE', 'ACTIVATE_USER', 'DEACTIVATE_USER', 'REFRESH_TOKEN',
        'CREATE_PRODUCT', 'UPDATE_PRODUCT', 'ARCHIVE_PRODUCT', 'RESTORE_PRODUCT', 'CREATE_CATEGORY', 'UPDATE_CATEGORY', 'CREATE_SUPPLIER', 'UPDATE_SUPPLIER',
        'CREATE_PO', 'APPROVE_PO', 'RECEIVE_GRN', 'ADJUST_STOCK', 'APPROVE_ADJUSTMENT',
        'CREATE_CUSTOMER', 'UPDATE_CUSTOMER', 'CREATE_SALES_ORDER', 'UPDATE_SALES_ORDER', 'CREATE_INVOICE', 'PROCESS_PAYMENT',
        'START_POS_SESSION', 'END_POS_SESSION', 'PROCESS_SALE', 'PROCESS_RETURN', 'PAID_IN', 'PAID_OUT', 'NO_SALE', 'MANAGER_OVERRIDE',
        'APPLY_DISCOUNT', 'VOID_TRANSACTION', 'ISSUE_REFUND', 'PROCESS_EXCHANGE', 'APPLY_COUPON', 'REDEEM_GIFT_CARD', 'ISSUE_GIFT_CARD',
        'ADD_STORE_CREDIT', 'USE_STORE_CREDIT', 'REPRINT_RECEIPT', 'PRICE_OVERRIDE'
    )),
    metadata TEXT, -- JSON stored as TEXT
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Categories table
CREATE TABLE categories (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    name TEXT NOT NULL,
    description TEXT,
    parent_id TEXT,
    path TEXT, -- Hierarchical path
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_by_id TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Brands table
CREATE TABLE brands (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_by_id TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Units table
CREATE TABLE units (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    name TEXT NOT NULL UNIQUE,
    symbol TEXT NOT NULL,
    base_unit_id TEXT,
    conversion_factor DECIMAL(10,4) DEFAULT 1.0,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_by_id TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (base_unit_id) REFERENCES units(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Products table
CREATE TABLE products (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT UNIQUE,
    barcode TEXT UNIQUE,
    category_id TEXT,
    brand_id TEXT,
    unit_id TEXT NOT NULL,
    
    -- Pricing
    cost_price DECIMAL(10,2) DEFAULT 0.00,
    selling_price DECIMAL(10,2) NOT NULL,
    markup_percentage DECIMAL(5,2),
    
    -- Inventory
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    reorder_point INTEGER,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT 1,
    is_archived BOOLEAN NOT NULL DEFAULT 0,
    
    -- Metadata
    weight DECIMAL(8,3),
    dimensions TEXT, -- JSON: {"length": 10, "width": 5, "height": 2}
    color TEXT,
    size TEXT,
    
    -- Audit
    created_by_id TEXT NOT NULL,
    updated_by_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Suppliers table
CREATE TABLE suppliers (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    
    -- Business info
    tax_id TEXT,
    payment_terms TEXT,
    credit_limit DECIMAL(12,2),
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT 1,
    
    -- Audit
    created_by_id TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Customers table
CREATE TABLE customers (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    
    -- Customer type
    customer_type TEXT NOT NULL DEFAULT 'individual' CHECK (customer_type IN ('individual', 'corporate')),
    
    -- Business info (for corporate)
    company_name TEXT,
    tax_id TEXT,
    
    -- Loyalty
    loyalty_points INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT 1,
    
    -- Audit
    created_by_id TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Purchase Orders table
CREATE TABLE purchase_orders (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    po_number TEXT UNIQUE NOT NULL,
    supplier_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED')),
    
    -- Dates
    order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_delivery_date DATETIME,
    received_date DATETIME,
    
    -- Financial
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_by_id TEXT NOT NULL,
    approved_by_id TEXT,
    received_by_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (received_by_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Purchase Order Items table
CREATE TABLE purchase_order_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    purchase_order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(12,2) NOT NULL,
    
    -- Audit
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Sales Orders table
CREATE TABLE sales_orders (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    order_number TEXT UNIQUE NOT NULL,
    customer_id TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED')),
    
    -- Dates
    order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    shipped_date DATETIME,
    delivered_date DATETIME,
    
    -- Financial
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_by_id TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sales Order Items table
CREATE TABLE sales_order_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    sales_order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    total_price DECIMAL(12,2) NOT NULL,
    
    -- Audit
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Stock Movements table (for inventory tracking)
CREATE TABLE stock_movements (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    product_id TEXT NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER_OUT', 'TRANSFER_IN', 'RETURN', 'DAMAGE')),
    quantity INTEGER NOT NULL,
    reference_id TEXT, -- Links to PO, SO, etc.
    reference_type TEXT, -- 'PURCHASE_ORDER', 'SALES_ORDER', 'ADJUSTMENT', etc.
    notes TEXT,
    
    -- Audit
    created_by_id TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
);

-- POS Sessions table
CREATE TABLE pos_sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    session_number TEXT UNIQUE NOT NULL,
    cashier_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'SUSPENDED')),
    
    -- Financial
    opening_cash DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    closing_cash DECIMAL(10,2),
    expected_cash DECIMAL(10,2),
    cash_difference DECIMAL(10,2),
    
    -- Counters
    total_sales INTEGER DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    
    -- Dates
    opened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    
    -- Audit
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Invoices table
CREATE TABLE invoices (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id TEXT,
    sales_order_id TEXT,
    pos_session_id TEXT,
    
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED')),
    
    -- Financial
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    balance_due DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    
    -- Dates
    invoice_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME,
    paid_date DATETIME,
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_by_id TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE SET NULL,
    FOREIGN KEY (pos_session_id) REFERENCES pos_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Invoice Items table
CREATE TABLE invoice_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    invoice_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    tax_percentage DECIMAL(5,2) DEFAULT 0.00,
    total_price DECIMAL(12,2) NOT NULL,
    
    -- Audit
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Payments table
CREATE TABLE payments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    invoice_id TEXT,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CHECK', 'STORE_CREDIT', 'OTHER')),
    amount DECIMAL(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED')),
    
    -- Payment details
    reference_number TEXT,
    notes TEXT,
    
    -- Dates
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit
    processed_by_id TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by_id) REFERENCES users(id) ON DELETE CASCADE
);

-- System Settings table
CREATE TABLE system_settings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    category TEXT,
    is_encrypted BOOLEAN DEFAULT 0,
    
    -- Audit
    updated_by_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (updated_by_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Backup Records table
CREATE TABLE backup_records (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    backup_type TEXT NOT NULL CHECK (backup_type IN ('AUTO', 'MANUAL', 'SCHEDULED')),
    status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILED', 'IN_PROGRESS')),
    
    -- Metadata
    description TEXT,
    compressed BOOLEAN DEFAULT 0,
    
    -- Audit
    created_by_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
);



