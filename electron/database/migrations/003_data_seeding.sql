-- Migration 003: Initial Data Seeding
-- Seeds the database with essential default data

-- First create a system user if none exists
INSERT OR IGNORE INTO users (id, username, email, display_name, password_hash, role, is_active, created_by_id) VALUES
('system-user-001', 'system', 'system@inventory.local', 'System User', '$2b$12$system.hash.placeholder', 'owner_ultimate_super_admin', 1, NULL);

-- Insert default system settings
INSERT OR IGNORE INTO system_settings (key, value, description, category) VALUES
('app_name', 'Inventory Management System', 'Application name', 'general'),
('app_version', '1.0.0', 'Application version', 'general'),
('company_name', 'Your Company', 'Company name', 'general'),
('currency', 'USD', 'Default currency', 'financial'),
('tax_rate', '0.10', 'Default tax rate (10%)', 'financial'),
('low_stock_threshold', '10', 'Low stock alert threshold', 'inventory'),
('auto_backup_enabled', 'true', 'Enable automatic backups', 'backup'),
('backup_retention_days', '30', 'Number of days to keep backups', 'backup'),
('pos_receipt_footer', 'Thank you for your business!', 'POS receipt footer text', 'pos'),
('pos_print_receipt', 'true', 'Auto-print receipts in POS', 'pos'),
('pos_require_cashier_login', 'true', 'Require cashier login for POS', 'pos'),
('inventory_tracking_enabled', 'true', 'Enable inventory tracking', 'inventory'),
('negative_stock_allowed', 'false', 'Allow negative stock levels', 'inventory'),
('auto_reorder_enabled', 'false', 'Enable automatic reordering', 'inventory'),
('email_notifications', 'false', 'Enable email notifications', 'notifications'),
('sms_notifications', 'false', 'Enable SMS notifications', 'notifications');

-- Insert default units
INSERT OR IGNORE INTO units (id, name, symbol, conversion_factor, is_active, created_by_id) VALUES
('unit-001', 'Piece', 'pcs', 1.0, 1, 'system-user-001'),
('unit-002', 'Kilogram', 'kg', 1.0, 1, 'system-user-001'),
('unit-003', 'Gram', 'g', 0.001, 1, 'system-user-001'),
('unit-004', 'Liter', 'L', 1.0, 1, 'system-user-001'),
('unit-005', 'Meter', 'm', 1.0, 1, 'system-user-001'),
('unit-006', 'Box', 'box', 1.0, 1, 'system-user-001'),
('unit-007', 'Pack', 'pack', 1.0, 1, 'system-user-001'),
('unit-008', 'Dozen', 'doz', 12.0, 1, 'system-user-001');

-- Insert default categories
INSERT OR IGNORE INTO categories (id, name, description, parent_id, path, is_active, created_by_id) VALUES
('cat-001', 'Electronics', 'Electronic devices and accessories', NULL, '/Electronics', 1, 'system-user-001'),
('cat-002', 'Computers', 'Computer hardware and accessories', 'cat-001', '/Electronics/Computers', 1, 'system-user-001'),
('cat-003', 'Mobile Phones', 'Smartphones and accessories', 'cat-001', '/Electronics/Mobile Phones', 1, 'system-user-001'),
('cat-004', 'Clothing', 'Apparel and fashion items', NULL, '/Clothing', 1, 'system-user-001'),
('cat-005', 'Men''s Clothing', 'Men''s apparel', 'cat-004', '/Clothing/Men''s Clothing', 1, 'system-user-001'),
('cat-006', 'Women''s Clothing', 'Women''s apparel', 'cat-004', '/Clothing/Women''s Clothing', 1, 'system-user-001'),
('cat-007', 'Home & Garden', 'Home improvement and garden supplies', NULL, '/Home & Garden', 1, 'system-user-001'),
('cat-008', 'Furniture', 'Home and office furniture', 'cat-007', '/Home & Garden/Furniture', 1, 'system-user-001'),
('cat-009', 'Kitchen', 'Kitchen appliances and utensils', 'cat-007', '/Home & Garden/Kitchen', 1, 'system-user-001'),
('cat-010', 'Books', 'Books and educational materials', NULL, '/Books', 1, 'system-user-001');

-- Insert default brands
INSERT OR IGNORE INTO brands (id, name, description, is_active, created_by_id) VALUES
('brand-001', 'Apple', 'Apple Inc. products', 1, 'system-user-001'),
('brand-002', 'Samsung', 'Samsung Electronics', 1, 'system-user-001'),
('brand-003', 'Microsoft', 'Microsoft Corporation', 1, 'system-user-001'),
('brand-004', 'Sony', 'Sony Corporation', 1, 'system-user-001'),
('brand-005', 'Nike', 'Nike athletic wear', 1, 'system-user-001'),
('brand-006', 'Adidas', 'Adidas athletic wear', 1, 'system-user-001'),
('brand-007', 'IKEA', 'IKEA furniture and home goods', 1, 'system-user-001'),
('brand-008', 'Generic', 'Generic brand products', 1, 'system-user-001');

-- Insert sample products
INSERT OR IGNORE INTO products (id, name, description, sku, barcode, category_id, brand_id, unit_id, cost_price, selling_price, stock_quantity, min_stock_level, is_active, created_by_id) VALUES
('prod-001', 'iPhone 15', 'Latest iPhone model', 'IPH15-128', '1234567890123', 'cat-003', 'brand-001', 'unit-001', 800.00, 999.00, 25, 5, 1, 'system-user-001'),
('prod-002', 'MacBook Pro 16"', 'Apple MacBook Pro 16-inch', 'MBP16-512', '2345678901234', 'cat-002', 'brand-001', 'unit-001', 2000.00, 2499.00, 10, 3, 1, 'system-user-001'),
('prod-003', 'Samsung Galaxy S24', 'Samsung Galaxy S24 smartphone', 'GAL24-256', '3456789012345', 'cat-003', 'brand-002', 'unit-001', 700.00, 899.00, 30, 5, 1, 'system-user-001'),
('prod-004', 'Nike Air Max 270', 'Nike Air Max 270 sneakers', 'NAM270-10', '4567890123456', 'cat-005', 'brand-005', 'unit-001', 80.00, 120.00, 50, 10, 1, 'system-user-001'),
('prod-005', 'Adidas Ultraboost 22', 'Adidas Ultraboost 22 running shoes', 'AUB22-9', '5678901234567', 'cat-005', 'brand-006', 'unit-001', 90.00, 140.00, 40, 8, 1, 'system-user-001'),
('prod-006', 'IKEA Billy Bookcase', 'White bookcase with 5 shelves', 'BILLY-WHT', '6789012345678', 'cat-008', 'brand-007', 'unit-001', 50.00, 79.99, 15, 3, 1, 'system-user-001'),
('prod-007', 'Wireless Mouse', 'Generic wireless optical mouse', 'WMOUSE-001', '7890123456789', 'cat-002', 'brand-008', 'unit-001', 5.00, 12.99, 100, 20, 1, 'system-user-001'),
('prod-008', 'USB-C Cable', 'USB-C to USB-C cable 2m', 'USBC-2M', '8901234567890', 'cat-002', 'brand-008', 'unit-001', 3.00, 8.99, 200, 50, 1, 'system-user-001'),
('prod-009', 'Programming Book', 'Learn JavaScript in 30 Days', 'BOOK-JS30', '9012345678901', 'cat-010', 'brand-008', 'unit-001', 15.00, 29.99, 75, 10, 1, 'system-user-001'),
('prod-010', 'Coffee Mug', 'Ceramic coffee mug 12oz', 'MUG-12OZ', '0123456789012', 'cat-009', 'brand-008', 'unit-001', 2.00, 6.99, 150, 25, 1, 'system-user-001');

-- Insert sample suppliers
INSERT OR IGNORE INTO suppliers (id, name, contact_person, email, phone, address, city, state, postal_code, country, payment_terms, credit_limit, is_active, created_by_id) VALUES
('supp-001', 'Tech Distributors Inc.', 'John Smith', 'john@techdist.com', '+1-555-0101', '123 Tech Street', 'San Francisco', 'CA', '94105', 'USA', 'Net 30', 50000.00, 1, 'system-user-001'),
('supp-002', 'Fashion Wholesale Ltd.', 'Sarah Johnson', 'sarah@fashionwholesale.com', '+1-555-0102', '456 Fashion Ave', 'New York', 'NY', '10001', 'USA', 'Net 15', 25000.00, 1, 'system-user-001'),
('supp-003', 'Home & Garden Supply', 'Mike Wilson', 'mike@hgsupply.com', '+1-555-0103', '789 Garden Road', 'Portland', 'OR', '97201', 'USA', 'Net 45', 30000.00, 1, 'system-user-001'),
('supp-004', 'Electronics Direct', 'Lisa Chen', 'lisa@electronicsdirect.com', '+1-555-0104', '321 Circuit Blvd', 'Austin', 'TX', '73301', 'USA', 'Net 30', 75000.00, 1, 'system-user-001'),
('supp-005', 'Book Publishers Co.', 'David Brown', 'david@bookpub.com', '+1-555-0105', '654 Library Lane', 'Boston', 'MA', '02101', 'USA', 'Net 60', 15000.00, 1, 'system-user-001');

-- Insert sample customers
INSERT OR IGNORE INTO customers (id, name, email, phone, address, city, state, postal_code, country, customer_type, loyalty_points, total_spent, is_active, created_by_id) VALUES
('cust-001', 'Alice Johnson', 'alice.johnson@email.com', '+1-555-1001', '100 Main Street', 'Los Angeles', 'CA', '90210', 'USA', 'individual', 150, 1250.00, 1, 'system-user-001'),
('cust-002', 'Bob Smith', 'bob.smith@email.com', '+1-555-1002', '200 Oak Avenue', 'Chicago', 'IL', '60601', 'USA', 'individual', 75, 650.00, 1, 'system-user-001'),
('cust-003', 'Tech Startup LLC', 'orders@techstartup.com', '+1-555-1003', '300 Innovation Drive', 'Seattle', 'WA', '98101', 'USA', 'corporate', 500, 5000.00, 1, 'system-user-001'),
('cust-004', 'Fashion Boutique', 'info@fashionboutique.com', '+1-555-1004', '400 Style Street', 'Miami', 'FL', '33101', 'USA', 'corporate', 200, 2000.00, 1, 'system-user-001'),
('cust-005', 'Home Decor Store', 'orders@homedecor.com', '+1-555-1005', '500 Design Way', 'Denver', 'CO', '80201', 'USA', 'corporate', 300, 3000.00, 1, 'system-user-001');

-- Insert migration record
INSERT INTO migrations (version, name, checksum) 
VALUES ('003', 'data_seeding', 'data_seeding_003');