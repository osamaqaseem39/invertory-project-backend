-- SQLite Indexes for Inventory Management System
-- Optimized for performance and common query patterns

-- ===== USER INDEXES =====

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_by_id ON users(created_by_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Refresh tokens indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_created_at ON refresh_tokens(created_at);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ===== PRODUCT CATALOG INDEXES =====

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_path ON categories(path);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_created_by_id ON categories(created_by_id);

-- Brands indexes
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_is_active ON brands(is_active);

-- Units indexes
CREATE INDEX IF NOT EXISTS idx_units_name ON units(name);
CREATE INDEX IF NOT EXISTS idx_units_symbol ON units(symbol);
CREATE INDEX IF NOT EXISTS idx_units_base_unit_id ON units(base_unit_id);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_unit_id ON products(unit_id);
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_min_stock_level ON products(min_stock_level);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON products(is_archived);
CREATE INDEX IF NOT EXISTS idx_products_selling_price ON products(selling_price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_active_not_archived ON products(is_active, is_archived);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_brand_active ON products(brand_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock_low ON products(stock_quantity, min_stock_level);

-- ===== SUPPLIER & CUSTOMER INDEXES =====

-- Suppliers indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_by_id ON suppliers(created_by_id);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_points ON customers(loyalty_points);
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON customers(total_spent);

-- ===== PURCHASE ORDER INDEXES =====

-- Purchase Orders indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_expected_delivery_date ON purchase_orders(expected_delivery_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_by_id ON purchase_orders(created_by_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_approved_by_id ON purchase_orders(approved_by_id);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_status ON purchase_orders(supplier_id, status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status_date ON purchase_orders(status, order_date);

-- Purchase Order Items indexes
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON purchase_order_items(product_id);

-- ===== SALES ORDER INDEXES =====

-- Sales Orders indexes
CREATE INDEX IF NOT EXISTS idx_sales_orders_order_number ON sales_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_order_date ON sales_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_sales_orders_shipped_date ON sales_orders(shipped_date);
CREATE INDEX IF NOT EXISTS idx_sales_orders_delivered_date ON sales_orders(delivered_date);
CREATE INDEX IF NOT EXISTS idx_sales_orders_created_by_id ON sales_orders(created_by_id);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_status ON sales_orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status_date ON sales_orders(status, order_date);

-- Sales Order Items indexes
CREATE INDEX IF NOT EXISTS idx_sales_order_items_so_id ON sales_order_items(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_product_id ON sales_order_items(product_id);

-- ===== INVENTORY TRACKING INDEXES =====

-- Stock Movements indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference_id ON stock_movements(reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference_type ON stock_movements(reference_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_by_id ON stock_movements(created_by_id);

-- Composite indexes for inventory queries
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_type ON stock_movements(product_id, movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_date ON stock_movements(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_type, reference_id);

-- ===== POS SYSTEM INDEXES =====

-- POS Sessions indexes
CREATE INDEX IF NOT EXISTS idx_pos_sessions_session_number ON pos_sessions(session_number);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_cashier_id ON pos_sessions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_status ON pos_sessions(status);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_opened_at ON pos_sessions(opened_at);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_closed_at ON pos_sessions(closed_at);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_pos_sessions_cashier_status ON pos_sessions(cashier_id, status);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_status_date ON pos_sessions(status, opened_at);

-- ===== INVOICING INDEXES =====

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_sales_order_id ON invoices(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_pos_session_id ON invoices(pos_session_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_paid_date ON invoices(paid_date);
CREATE INDEX IF NOT EXISTS idx_invoices_total_amount ON invoices(total_amount);
CREATE INDEX IF NOT EXISTS idx_invoices_balance_due ON invoices(balance_due);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by_id ON invoices(created_by_id);

-- Composite indexes for common invoice queries
CREATE INDEX IF NOT EXISTS idx_invoices_customer_status ON invoices(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_status_date ON invoices(status, invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date_status ON invoices(due_date, status);
CREATE INDEX IF NOT EXISTS idx_invoices_overdue ON invoices(status, due_date) WHERE status = 'SENT';

-- Invoice Items indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id);

-- ===== PAYMENT INDEXES =====

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_amount ON payments(amount);
CREATE INDEX IF NOT EXISTS idx_payments_processed_by_id ON payments(processed_by_id);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_method ON payments(invoice_id, payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_method_date ON payments(payment_method, payment_date);

-- ===== SYSTEM INDEXES =====

-- System Settings indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- Backup Records indexes
CREATE INDEX IF NOT EXISTS idx_backup_records_backup_type ON backup_records(backup_type);
CREATE INDEX IF NOT EXISTS idx_backup_records_status ON backup_records(status);
CREATE INDEX IF NOT EXISTS idx_backup_records_created_at ON backup_records(created_at);
CREATE INDEX IF NOT EXISTS idx_backup_records_created_by_id ON backup_records(created_by_id);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_backup_records_type_status ON backup_records(backup_type, status);
CREATE INDEX IF NOT EXISTS idx_backup_records_status_date ON backup_records(status, created_at);

-- ===== FULL-TEXT SEARCH INDEXES =====

-- Enable FTS5 for products
CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
    name,
    description,
    sku,
    barcode,
    content='products',
    content_rowid='rowid'
);

-- Enable FTS5 for customers
CREATE VIRTUAL TABLE IF NOT EXISTS customers_fts USING fts5(
    name,
    email,
    company_name,
    content='customers',
    content_rowid='rowid'
);

-- Enable FTS5 for suppliers
CREATE VIRTUAL TABLE IF NOT EXISTS suppliers_fts USING fts5(
    name,
    contact_person,
    email,
    content='suppliers',
    content_rowid='rowid'
);

-- ===== PERFORMANCE OPTIMIZATION INDEXES =====

-- Covering indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_search ON products(name, sku, barcode, is_active, is_archived);
CREATE INDEX IF NOT EXISTS idx_products_inventory ON products(id, stock_quantity, min_stock_level, reorder_point);
CREATE INDEX IF NOT EXISTS idx_sales_summary ON invoices(invoice_date, total_amount, status);
CREATE INDEX IF NOT EXISTS idx_inventory_movements ON stock_movements(product_id, created_at, movement_type, quantity);

-- ===== MAINTENANCE INDEXES =====

-- Indexes for cleanup and maintenance operations
CREATE INDEX IF NOT EXISTS idx_audit_logs_cleanup ON audit_logs(created_at) WHERE created_at < date('now', '-90 days');
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_cleanup ON refresh_tokens(expires_at) WHERE expires_at < datetime('now');
CREATE INDEX IF NOT EXISTS idx_backup_cleanup ON backup_records(created_at) WHERE created_at < date('now', '-30 days');

-- ===== STATISTICS FOR QUERY OPTIMIZER =====

-- Update table statistics for better query planning
ANALYZE;

-- ===== INDEX USAGE MONITORING =====

-- Views to monitor index usage (SQLite doesn't have built-in index usage stats)
CREATE VIEW IF NOT EXISTS index_info AS
SELECT 
    name,
    tbl_name,
    sql
FROM sqlite_master 
WHERE type = 'index' 
AND name NOT LIKE 'sqlite_%'
ORDER BY tbl_name, name;

-- View to show table sizes
CREATE VIEW IF NOT EXISTS table_sizes AS
SELECT 
    name as table_name,
    (SELECT COUNT(*) FROM sqlite_master sm2 WHERE sm2.type = 'table' AND sm2.name = sm1.name) as row_count
FROM sqlite_master sm1
WHERE type = 'table' 
AND name NOT LIKE 'sqlite_%'
ORDER BY row_count DESC;



