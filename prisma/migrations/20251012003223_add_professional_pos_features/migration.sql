-- CreateEnum
CREATE TYPE "CashEventType" AS ENUM ('PAID_IN', 'PAID_OUT', 'NO_SALE', 'CASH_DROP', 'PETTY_CASH');

-- CreateEnum
CREATE TYPE "TaxClass" AS ENUM ('STANDARD', 'REDUCED', 'ZERO', 'EXEMPT');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FLAT');

-- CreateEnum
CREATE TYPE "RefundMethod" AS ENUM ('ORIGINAL_PAYMENT', 'CASH', 'STORE_CREDIT', 'GIFT_CARD');

-- CreateEnum
CREATE TYPE "PricebookType" AS ENUM ('BASE', 'PROMOTIONAL', 'SEASONAL', 'CLEARANCE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'PAID_IN';
ALTER TYPE "AuditAction" ADD VALUE 'PAID_OUT';
ALTER TYPE "AuditAction" ADD VALUE 'NO_SALE';
ALTER TYPE "AuditAction" ADD VALUE 'MANAGER_OVERRIDE';
ALTER TYPE "AuditAction" ADD VALUE 'APPLY_DISCOUNT';
ALTER TYPE "AuditAction" ADD VALUE 'VOID_TRANSACTION';
ALTER TYPE "AuditAction" ADD VALUE 'ISSUE_REFUND';
ALTER TYPE "AuditAction" ADD VALUE 'PROCESS_EXCHANGE';
ALTER TYPE "AuditAction" ADD VALUE 'APPLY_COUPON';
ALTER TYPE "AuditAction" ADD VALUE 'REDEEM_GIFT_CARD';
ALTER TYPE "AuditAction" ADD VALUE 'ISSUE_GIFT_CARD';
ALTER TYPE "AuditAction" ADD VALUE 'ADD_STORE_CREDIT';
ALTER TYPE "AuditAction" ADD VALUE 'USE_STORE_CREDIT';
ALTER TYPE "AuditAction" ADD VALUE 'REPRINT_RECEIPT';
ALTER TYPE "AuditAction" ADD VALUE 'PRICE_OVERRIDE';

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "loyalty_points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "store_credit_balance" DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "pos_sessions" ADD COLUMN     "total_paid_in" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "total_paid_out" DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "pos_transaction_items" ADD COLUMN     "discount_reason" VARCHAR(100),
ADD COLUMN     "is_refunded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "original_price" DECIMAL(12,2),
ADD COLUMN     "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "tax_class" "TaxClass" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "tax_inclusive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "weight" DECIMAL(10,3);

-- AlterTable
ALTER TABLE "pos_transactions" ADD COLUMN     "coupon_code" VARCHAR(50),
ADD COLUMN     "coupon_discount" DECIMAL(12,2),
ADD COLUMN     "is_refund" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loyalty_points_earned" INTEGER,
ADD COLUMN     "loyalty_points_used" INTEGER,
ADD COLUMN     "original_transaction_id" UUID,
ADD COLUMN     "price_book_id" UUID,
ADD COLUMN     "refund_method" "RefundMethod",
ADD COLUMN     "rounding_delta" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "is_weighted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "price_per_unit" DECIMAL(12,2),
ADD COLUMN     "tax_class" "TaxClass" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "tax_rate_override" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "can_approve_overrides" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "max_cart_discount" DECIMAL(5,2),
ADD COLUMN     "max_line_discount" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "cash_events" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "type" "CashEventType" NOT NULL,
    "amount" DECIMAL(12,2),
    "reason" TEXT NOT NULL,
    "reference" VARCHAR(100),
    "actor_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_books" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "type" "PricebookType" NOT NULL DEFAULT 'BASE',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "store_id" UUID,
    "terminal_id" UUID,
    "start_at" TIMESTAMPTZ,
    "end_at" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "price_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_book_items" (
    "id" UUID NOT NULL,
    "price_book_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "promo_price" DECIMAL(12,2) NOT NULL,
    "start_at" TIMESTAMPTZ,
    "end_at" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_book_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "min_purchase_amount" DECIMAL(12,2),
    "max_discount_amount" DECIMAL(12,2),
    "max_uses" INTEGER,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "per_customer_limit" INTEGER,
    "start_at" TIMESTAMPTZ NOT NULL,
    "end_at" TIMESTAMPTZ NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_cards" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "initial_balance" DECIMAL(12,2) NOT NULL,
    "current_balance" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "customer_id" UUID,
    "issued_by_id" UUID NOT NULL,
    "issued_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,
    "last_used_at" TIMESTAMPTZ,

    CONSTRAINT "gift_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_credit_ledger" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "delta" DECIMAL(12,2) NOT NULL,
    "balance_after" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "transaction_id" UUID,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_credit_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_ledger" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "points_delta" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "transaction_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barcode_aliases" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "barcode" VARCHAR(64) NOT NULL,
    "description" VARCHAR(200),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "barcode_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plu_codes" (
    "id" UUID NOT NULL,
    "plu_code" VARCHAR(20) NOT NULL,
    "product_id" UUID NOT NULL,
    "is_weighted" BOOLEAN NOT NULL DEFAULT false,
    "price_per_unit" DECIMAL(12,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plu_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manager_overrides" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "requesting_user_id" UUID NOT NULL,
    "override_type" VARCHAR(50) NOT NULL,
    "reason_code" VARCHAR(50) NOT NULL,
    "reason_detail" TEXT,
    "approver_id" UUID NOT NULL,
    "metadata" JSONB,
    "approved_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manager_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "data_type" VARCHAR(20) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "updated_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_events_session_id_idx" ON "cash_events"("session_id");

-- CreateIndex
CREATE INDEX "cash_events_type_idx" ON "cash_events"("type");

-- CreateIndex
CREATE INDEX "cash_events_actor_id_idx" ON "cash_events"("actor_id");

-- CreateIndex
CREATE INDEX "cash_events_created_at_idx" ON "cash_events"("created_at");

-- CreateIndex
CREATE INDEX "price_books_is_active_idx" ON "price_books"("is_active");

-- CreateIndex
CREATE INDEX "price_books_start_at_end_at_idx" ON "price_books"("start_at", "end_at");

-- CreateIndex
CREATE INDEX "price_books_type_idx" ON "price_books"("type");

-- CreateIndex
CREATE INDEX "price_book_items_product_id_idx" ON "price_book_items"("product_id");

-- CreateIndex
CREATE INDEX "price_book_items_is_active_idx" ON "price_book_items"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "price_book_items_price_book_id_product_id_key" ON "price_book_items"("price_book_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_code_idx" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_is_active_idx" ON "coupons"("is_active");

-- CreateIndex
CREATE INDEX "coupons_start_at_end_at_idx" ON "coupons"("start_at", "end_at");

-- CreateIndex
CREATE UNIQUE INDEX "gift_cards_code_key" ON "gift_cards"("code");

-- CreateIndex
CREATE INDEX "gift_cards_code_idx" ON "gift_cards"("code");

-- CreateIndex
CREATE INDEX "gift_cards_is_active_idx" ON "gift_cards"("is_active");

-- CreateIndex
CREATE INDEX "gift_cards_customer_id_idx" ON "gift_cards"("customer_id");

-- CreateIndex
CREATE INDEX "store_credit_ledger_customer_id_idx" ON "store_credit_ledger"("customer_id");

-- CreateIndex
CREATE INDEX "store_credit_ledger_created_at_idx" ON "store_credit_ledger"("created_at");

-- CreateIndex
CREATE INDEX "loyalty_ledger_customer_id_idx" ON "loyalty_ledger"("customer_id");

-- CreateIndex
CREATE INDEX "loyalty_ledger_created_at_idx" ON "loyalty_ledger"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "barcode_aliases_barcode_key" ON "barcode_aliases"("barcode");

-- CreateIndex
CREATE INDEX "barcode_aliases_barcode_idx" ON "barcode_aliases"("barcode");

-- CreateIndex
CREATE INDEX "barcode_aliases_product_id_idx" ON "barcode_aliases"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "plu_codes_plu_code_key" ON "plu_codes"("plu_code");

-- CreateIndex
CREATE INDEX "plu_codes_plu_code_idx" ON "plu_codes"("plu_code");

-- CreateIndex
CREATE INDEX "plu_codes_product_id_idx" ON "plu_codes"("product_id");

-- CreateIndex
CREATE INDEX "manager_overrides_session_id_idx" ON "manager_overrides"("session_id");

-- CreateIndex
CREATE INDEX "manager_overrides_requesting_user_id_idx" ON "manager_overrides"("requesting_user_id");

-- CreateIndex
CREATE INDEX "manager_overrides_approver_id_idx" ON "manager_overrides"("approver_id");

-- CreateIndex
CREATE INDEX "manager_overrides_override_type_idx" ON "manager_overrides"("override_type");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- CreateIndex
CREATE INDEX "system_config_category_idx" ON "system_config"("category");

-- CreateIndex
CREATE INDEX "system_config_key_idx" ON "system_config"("key");

-- CreateIndex
CREATE INDEX "pos_transactions_price_book_id_idx" ON "pos_transactions"("price_book_id");

-- CreateIndex
CREATE INDEX "pos_transactions_is_refund_idx" ON "pos_transactions"("is_refund");

-- AddForeignKey
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_price_book_id_fkey" FOREIGN KEY ("price_book_id") REFERENCES "price_books"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_events" ADD CONSTRAINT "cash_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "pos_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_events" ADD CONSTRAINT "cash_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_books" ADD CONSTRAINT "price_books_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_book_items" ADD CONSTRAINT "price_book_items_price_book_id_fkey" FOREIGN KEY ("price_book_id") REFERENCES "price_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_book_items" ADD CONSTRAINT "price_book_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_issued_by_id_fkey" FOREIGN KEY ("issued_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_credit_ledger" ADD CONSTRAINT "store_credit_ledger_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_credit_ledger" ADD CONSTRAINT "store_credit_ledger_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "pos_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_credit_ledger" ADD CONSTRAINT "store_credit_ledger_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_ledger" ADD CONSTRAINT "loyalty_ledger_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_ledger" ADD CONSTRAINT "loyalty_ledger_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "pos_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barcode_aliases" ADD CONSTRAINT "barcode_aliases_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plu_codes" ADD CONSTRAINT "plu_codes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_overrides" ADD CONSTRAINT "manager_overrides_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "pos_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_overrides" ADD CONSTRAINT "manager_overrides_requesting_user_id_fkey" FOREIGN KEY ("requesting_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_overrides" ADD CONSTRAINT "manager_overrides_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_config" ADD CONSTRAINT "system_config_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
