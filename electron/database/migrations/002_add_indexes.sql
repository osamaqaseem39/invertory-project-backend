-- Migration 002: Add Basic Indexes
-- Adds essential indexes for core tables

-- ===== USER INDEXES =====

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_by_id ON users(created_by_id);

-- Refresh tokens indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

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

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_points ON customers(loyalty_points);
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON customers(total_spent);

-- ===== SYSTEM INDEXES =====

-- System Settings indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- Backup Records indexes
CREATE INDEX IF NOT EXISTS idx_backup_records_backup_type ON backup_records(backup_type);
CREATE INDEX IF NOT EXISTS idx_backup_records_status ON backup_records(status);
CREATE INDEX IF NOT EXISTS idx_backup_records_created_at ON backup_records(created_at);

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

-- ===== FTS TRIGGERS =====

-- Product FTS triggers
CREATE TRIGGER IF NOT EXISTS trigger_products_fts_insert
    AFTER INSERT ON products
BEGIN
    INSERT INTO products_fts(rowid, name, description, sku, barcode)
    VALUES (NEW.rowid, NEW.name, NEW.description, NEW.sku, NEW.barcode);
END;

CREATE TRIGGER IF NOT EXISTS trigger_products_fts_update
    AFTER UPDATE ON products
BEGIN
    UPDATE products_fts SET
        name = NEW.name,
        description = NEW.description,
        sku = NEW.sku,
        barcode = NEW.barcode
    WHERE rowid = NEW.rowid;
END;

CREATE TRIGGER IF NOT EXISTS trigger_products_fts_delete
    AFTER DELETE ON products
BEGIN
    DELETE FROM products_fts WHERE rowid = OLD.rowid;
END;

-- Customer FTS triggers
CREATE TRIGGER IF NOT EXISTS trigger_customers_fts_insert
    AFTER INSERT ON customers
BEGIN
    INSERT INTO customers_fts(rowid, name, email, company_name)
    VALUES (NEW.rowid, NEW.name, NEW.email, NEW.company_name);
END;

CREATE TRIGGER IF NOT EXISTS trigger_customers_fts_update
    AFTER UPDATE ON customers
BEGIN
    UPDATE customers_fts SET
        name = NEW.name,
        email = NEW.email,
        company_name = NEW.company_name
    WHERE rowid = NEW.rowid;
END;

CREATE TRIGGER IF NOT EXISTS trigger_customers_fts_delete
    AFTER DELETE ON customers
BEGIN
    DELETE FROM customers_fts WHERE rowid = OLD.rowid;
END;

-- Supplier FTS triggers
CREATE TRIGGER IF NOT EXISTS trigger_suppliers_fts_insert
    AFTER INSERT ON suppliers
BEGIN
    INSERT INTO suppliers_fts(rowid, name, contact_person, email)
    VALUES (NEW.rowid, NEW.name, NEW.contact_person, NEW.email);
END;

CREATE TRIGGER IF NOT EXISTS trigger_suppliers_fts_update
    AFTER UPDATE ON suppliers
BEGIN
    UPDATE suppliers_fts SET
        name = NEW.name,
        contact_person = NEW.contact_person,
        email = NEW.email
    WHERE rowid = NEW.rowid;
END;

CREATE TRIGGER IF NOT EXISTS trigger_suppliers_fts_delete
    AFTER DELETE ON suppliers
BEGIN
    DELETE FROM suppliers_fts WHERE rowid = OLD.rowid;
END;

-- Update table statistics for better query planning
ANALYZE;

-- Insert migration record
INSERT INTO migrations (version, name, checksum) 
VALUES ('002', 'add_indexes', 'add_indexes_002');