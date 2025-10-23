-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('PRINTED', 'EMAILED', 'VOIDED');

-- CreateTable
CREATE TABLE "receipts" (
    "id" UUID NOT NULL,
    "receipt_number" VARCHAR(50) NOT NULL,
    "transaction_id" UUID NOT NULL,
    "receipt_data" JSONB NOT NULL,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'PRINTED',
    "printed_at" TIMESTAMPTZ,
    "emailed_at" TIMESTAMPTZ,
    "email_address" VARCHAR(255),
    "reprint_count" INTEGER NOT NULL DEFAULT 0,
    "last_reprinted_at" TIMESTAMPTZ,
    "reprinted_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_settings" (
    "id" UUID NOT NULL,
    "store_id" UUID,
    "terminal_id" UUID,
    "business_name" VARCHAR(200) NOT NULL,
    "business_address" TEXT,
    "business_phone" VARCHAR(50),
    "business_email" VARCHAR(255),
    "tax_id" VARCHAR(100),
    "header_text" TEXT,
    "footer_text" TEXT,
    "return_policy" TEXT,
    "print_logo" BOOLEAN NOT NULL DEFAULT false,
    "logo_url" TEXT,
    "print_barcode" BOOLEAN NOT NULL DEFAULT true,
    "print_qr_code" BOOLEAN NOT NULL DEFAULT true,
    "paper_width" INTEGER NOT NULL DEFAULT 80,
    "font_size" INTEGER NOT NULL DEFAULT 12,
    "show_tax_breakdown" BOOLEAN NOT NULL DEFAULT true,
    "show_cashier_name" BOOLEAN NOT NULL DEFAULT true,
    "show_customer_info" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "updated_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "print_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "receipts_receipt_number_key" ON "receipts"("receipt_number");

-- CreateIndex
CREATE INDEX "receipts_receipt_number_idx" ON "receipts"("receipt_number");

-- CreateIndex
CREATE INDEX "receipts_transaction_id_idx" ON "receipts"("transaction_id");

-- CreateIndex
CREATE INDEX "receipts_status_idx" ON "receipts"("status");

-- CreateIndex
CREATE INDEX "receipts_created_at_idx" ON "receipts"("created_at");

-- CreateIndex
CREATE INDEX "print_settings_is_default_idx" ON "print_settings"("is_default");

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "pos_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_settings" ADD CONSTRAINT "print_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
