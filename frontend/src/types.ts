export enum UserRole {
  OWNER_ULTIMATE_SUPER_ADMIN = 'owner_ultimate_super_admin',
  ADMIN = 'admin',
  CASHIER = 'cashier',
  INVENTORY_MANAGER = 'inventory_manager',
  GUEST = 'guest',
  MASTER_ADMIN = 'master_admin',
}

export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  role: UserRole;
  is_active: boolean;
  created_by_id?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  // Professional POS fields
  max_line_discount?: number;
  max_cart_discount?: number;
  can_approve_overrides?: boolean;
}

export interface AuthResponse {
  message: string;
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface Permissions {
  can_create_users: boolean;
  can_list_users: boolean;
  can_delete_users: boolean;
  can_change_roles: boolean;
  can_change_status: boolean;
  can_view_audit_logs: boolean;
  allowed_creation_roles: UserRole[];
}

export interface AuditLog {
  id: string;
  actor_user_id: string;
  target_user_id?: string;
  action: string;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  actor: {
    id: string;
    username: string;
    display_name: string;
  };
  target?: {
    id: string;
    username: string;
    display_name: string;
  };
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<UserRole, number>;
  recentUsers: User[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  is_primary: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  brand?: string;
  brand_ar?: string;
  category?: string;
  category_id?: string;
  price: number;
  cost?: number;
  uom: string;
  stock_quantity: number;
  reorder_level: number;
  reorder_quantity?: number;
  max_stock_level?: number;
  is_active: boolean;
  is_archived: boolean;
  created_by_id: string;
  updated_by_id?: string;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
  created_by?: {
    id: string;
    username: string;
    display_name: string;
  };
  updated_by?: {
    id: string;
    username: string;
    display_name: string;
  };
}

export interface ProductStatistics {
  totalProducts: number;
  activeProducts: number;
  archivedProducts: number;
  productsByCategory: Array<{ category: string; count: number }>;
  productsByBrand: Array<{ brand: string; count: number }>;
  recentProducts: Product[];
}

// ===== INVENTORY TYPES =====

export interface Category {
  id: string;
  name: string;
  name_ar?: string;
  description: string | null;
  description_ar?: string;
  parent_id: string | null;
  parent?: { id: string; name: string } | null;
  children?: Array<{ id: string; name: string }>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  _count?: {
    products: number;
    children: number;
  };
}

export interface Supplier {
  id: string;
  name: string;
  name_ar?: string;
  contact_person: string | null;
  contact_person_ar?: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  address_ar?: string;
  tax_id: string | null;
  payment_terms: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  _count?: {
    purchase_orders: number;
  };
}

export enum POStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export interface PurchaseOrderItem {
  id: string;
  product_id: string;
  product?: { id: string; name: string; sku: string; uom: string };
  quantity: number;
  unit_price: number;
  received_quantity: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier?: { id: string; name: string };
  status: POStatus;
  total_amount: number;
  expected_date: string | null;
  notes: string | null;
  created_by_id: string;
  approved_by_id: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  items?: PurchaseOrderItem[];
  _count?: {
    items: number;
    goods_receipts: number;
  };
}

export enum AdjustmentReason {
  DAMAGE = 'DAMAGE',
  THEFT = 'THEFT',
  COUNT_ERROR = 'COUNT_ERROR',
  EXPIRED = 'EXPIRED',
  LOST = 'LOST',
  OTHER = 'OTHER',
}

export enum AdjustmentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface StockAdjustment {
  id: string;
  adjustment_number: string;
  product_id: string;
  product?: { id: string; name: string; sku: string };
  old_quantity: number;
  new_quantity: number;
  difference: number;
  reason: AdjustmentReason;
  status: AdjustmentStatus;
  notes: string | null;
  created_by_id: string;
  approved_by_id: string | null;
  created_at: string;
  approved_at: string | null;
}

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER_OUT = 'TRANSFER_OUT',
  TRANSFER_IN = 'TRANSFER_IN',
  RETURN = 'RETURN',
  DAMAGE = 'DAMAGE',
}

// ===== SALES TYPES =====

export enum SalesOrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  STORE_CREDIT = 'STORE_CREDIT',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum POSSessionStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  SUSPENDED = 'SUSPENDED',
}

export enum ReturnStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSED = 'PROCESSED',
}

export enum ReturnReason {
  DEFECTIVE = 'DEFECTIVE',
  WRONG_ITEM = 'WRONG_ITEM',
  NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED',
  CHANGED_MIND = 'CHANGED_MIND',
  DUPLICATE_ORDER = 'DUPLICATE_ORDER',
  OTHER = 'OTHER',
}

export interface Customer {
  id: string;
  customer_number: string;
  first_name: string;
  first_name_ar?: string;
  last_name: string;
  last_name_ar?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line1_ar?: string;
  address_line2?: string;
  address_line2_ar?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  company_name?: string;
  company_name_ar?: string;
  tax_id?: string;
  credit_limit?: number;
  payment_terms?: string;
  discount_percentage?: number;
  is_active: boolean;
  is_vip: boolean;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  created_by?: {
    id: string;
    username: string;
    display_name: string;
  };
  _count?: {
    sales_orders: number;
    invoices: number;
    payments: number;
  };
  sales_orders?: SalesOrder[];
  invoices?: Invoice[];
}

export interface SalesOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer?: Customer;
  status: SalesOrderStatus;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  final_amount: number;
  order_date: string;
  required_date?: string;
  shipped_date?: string;
  delivered_date?: string;
  notes?: string;
  shipping_address?: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  items?: SalesOrderItem[];
  invoices?: Invoice[];
  created_by?: {
    id: string;
    username: string;
    display_name: string;
  };
  _count?: {
    items: number;
    invoices: number;
  };
}

export interface SalesOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  line_total: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer?: Customer;
  sales_order_id?: string;
  sales_order?: SalesOrder;
  status: InvoiceStatus;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  invoice_date: string;
  due_date: string;
  paid_date?: string;
  notes?: string;
  terms?: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  payments?: Payment[];
  created_by?: {
    id: string;
    username: string;
    display_name: string;
  };
}

export interface Payment {
  id: string;
  payment_number: string;
  invoice_id: string;
  invoice?: Invoice;
  customer_id: string;
  customer?: Customer;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  reference_number?: string;
  notes?: string;
  payment_date: string;
  processed_by_id: string;
  created_at: string;
  processed_by?: {
    id: string;
    username: string;
    display_name: string;
  };
}

export interface POSSession {
  id: string;
  session_number: string;
  cashier_id: string;
  cashier?: {
    id: string;
    username: string;
    display_name: string;
  };
  status: POSSessionStatus;
  starting_cash: number;
  ending_cash?: number;
  total_sales: number;
  total_transactions: number;
  start_time: string;
  end_time?: string;
  transactions?: POSTransaction[];
  _count?: {
    transactions: number;
  };
}

export interface POSTransaction {
  id: string;
  transaction_number: string;
  session_id: string;
  session?: POSSession;
  transaction_type: 'SALE' | 'RETURN' | 'REFUND';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  amount_tendered: number;
  change_amount: number;
  customer_id?: string;
  customer?: Customer;
  notes?: string;
  transaction_date: string;
  items?: POSTransactionItem[];
}

export interface POSTransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  line_total: number;
}

export interface Return {
  id: string;
  return_number: string;
  sales_order_id?: string;
  sales_order?: SalesOrder;
  transaction_id?: string;
  transaction?: POSTransaction;
  customer_id: string;
  customer?: Customer;
  status: ReturnStatus;
  reason: ReturnReason;
  total_amount: number;
  refund_amount: number;
  notes?: string;
  return_date: string;
  processed_date?: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  items?: ReturnItem[];
  created_by?: {
    id: string;
    username: string;
    display_name: string;
  };
}

export interface ReturnItem {
  id: string;
  return_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
  condition: 'NEW' | 'USED' | 'DAMAGED';
  line_total: number;
}

export interface SalesStatistics {
  total_customers: number;
  active_customers: number;
  total_sales_orders: number;
  pending_sales_orders: number;
  total_invoices: number;
  unpaid_invoices: number;
  total_revenue: number;
  today_revenue: number;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product?: { id: string; name: string; sku: string };
  movement_type: StockMovementType;
  quantity: number;
  reference_number: string | null;
  reason: string | null;
  from_location: string | null;
  to_location: string | null;
  performed_by_id: string;
  created_at: string;
}

// ===== PROFESSIONAL POS TYPES =====

export enum CashEventType {
  PAID_IN = 'PAID_IN',
  PAID_OUT = 'PAID_OUT',
  NO_SALE = 'NO_SALE',
  CASH_DROP = 'CASH_DROP',
  PETTY_CASH = 'PETTY_CASH',
}

export enum TaxClass {
  STANDARD = 'STANDARD',
  REDUCED = 'REDUCED',
  ZERO = 'ZERO',
  EXEMPT = 'EXEMPT',
}

export enum DiscountType {
  PERCENT = 'PERCENT',
  FLAT = 'FLAT',
}

export enum RefundMethod {
  ORIGINAL_PAYMENT = 'ORIGINAL_PAYMENT',
  CASH = 'CASH',
  STORE_CREDIT = 'STORE_CREDIT',
  GIFT_CARD = 'GIFT_CARD',
}

export enum PricebookType {
  BASE = 'BASE',
  PROMOTIONAL = 'PROMOTIONAL',
  SEASONAL = 'SEASONAL',
  CLEARANCE = 'CLEARANCE',
}

export interface CashEvent {
  id: string;
  session_id: string;
  type: CashEventType;
  amount?: number;
  reason: string;
  reference?: string;
  actor_id: string;
  actor?: { display_name: string; role: UserRole };
  created_at: string;
}

export interface PriceBook {
  id: string;
  name: string;
  description?: string;
  type: PricebookType;
  priority: number;
  store_id?: string;
  terminal_id?: string;
  start_at?: string;
  end_at?: string;
  is_active: boolean;
  items?: PriceBookItem[];
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface PriceBookItem {
  id: string;
  price_book_id: string;
  product_id: string;
  product?: { id: string; name: string; sku: string; price: number };
  promo_price: number;
  start_at?: string;
  end_at?: string;
  is_active: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  max_uses?: number;
  current_uses: number;
  per_customer_limit?: number;
  start_at: string;
  end_at: string;
  is_active: boolean;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface GiftCard {
  id: string;
  code: string;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  is_used: boolean;
  customer_id?: string;
  customer?: Customer;
  issued_by_id: string;
  issued_at: string;
  expires_at?: string;
  last_used_at?: string;
}

export interface StoreCreditLedger {
  id: string;
  customer_id: string;
  delta: number;
  balance_after: number;
  reason: string;
  transaction_id?: string;
  created_by_id: string;
  created_by?: { display_name: string };
  created_at: string;
}

export interface LoyaltyLedger {
  id: string;
  customer_id: string;
  points_delta: number;
  balance_after: number;
  reason: string;
  transaction_id?: string;
  created_at: string;
}

export interface BarcodeAlias {
  id: string;
  product_id: string;
  barcode: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface PLUCode {
  id: string;
  plu_code: string;
  product_id: string;
  product?: Product;
  is_weighted: boolean;
  price_per_unit?: number;
  is_active: boolean;
  created_at: string;
}

export interface ManagerOverride {
  id: string;
  session_id: string;
  requesting_user_id: string;
  requesting_user?: { display_name: string; role: UserRole };
  override_type: string;
  reason_code: string;
  reason_detail?: string;
  approver_id: string;
  approver?: { display_name: string; role: UserRole };
  metadata?: any;
  approved_at: string;
}

export interface DiscountCaps {
  max_line_discount: number;
  max_cart_discount: number;
  can_override: boolean;
}

export interface ZReportData {
  session: {
    session_number: string;
    cashier: string;
    start_time: string;
    end_time?: string;
    starting_cash: number;
    ending_cash: number;
  };
  sales: {
    total: number;
    count: number;
    by_payment_method: Record<string, { total: number; count: number }>;
  };
  cash_events: {
    paid_in: number;
    paid_out: number;
    no_sale_count: number;
  };
  expected_cash: number;
  actual_cash: number;
  variance: number;
  top_products: Array<{
    product_name: string;
    quantity: number;
    total: number;
  }>;
}

