-- CreateEnum
CREATE TYPE "OCRStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVIEWED');

-- CreateEnum
CREATE TYPE "OCRSourceType" AS ENUM ('RECEIPT', 'INVOICE', 'PURCHASE_ORDER', 'PRICE_LIST');

-- CreateTable
CREATE TABLE "ocr_scans" (
    "id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_type" VARCHAR(50) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "source_type" "OCRSourceType" NOT NULL,
    "source_reference" VARCHAR(100),
    "status" "OCRStatus" NOT NULL DEFAULT 'PENDING',
    "raw_text" TEXT,
    "confidence_score" DECIMAL(5,2),
    "processing_time" INTEGER,
    "error_message" TEXT,
    "vendor_name" VARCHAR(255),
    "document_date" DATE,
    "document_total" DECIMAL(12,2),
    "currency" VARCHAR(10),
    "products_count" INTEGER NOT NULL DEFAULT 0,
    "uploaded_by_id" UUID NOT NULL,
    "reviewed_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "reviewed_at" TIMESTAMPTZ,

    CONSTRAINT "ocr_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_products" (
    "id" UUID NOT NULL,
    "scan_id" UUID NOT NULL,
    "raw_text" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sku" VARCHAR(100),
    "barcode" VARCHAR(100),
    "description" TEXT,
    "quantity" DECIMAL(12,3),
    "unit_price" DECIMAL(12,2),
    "total_price" DECIMAL(12,2),
    "matched_product_id" UUID,
    "confidence_score" DECIMAL(5,2),
    "is_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "is_added_to_inventory" BOOLEAN NOT NULL DEFAULT false,
    "corrected_name" VARCHAR(255),
    "corrected_sku" VARCHAR(100),
    "corrected_price" DECIMAL(12,2),
    "correction_notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ocr_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ocr_scans_uploaded_by_id_idx" ON "ocr_scans"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "ocr_scans_status_idx" ON "ocr_scans"("status");

-- CreateIndex
CREATE INDEX "ocr_scans_source_type_idx" ON "ocr_scans"("source_type");

-- CreateIndex
CREATE INDEX "ocr_scans_created_at_idx" ON "ocr_scans"("created_at");

-- CreateIndex
CREATE INDEX "ocr_products_scan_id_idx" ON "ocr_products"("scan_id");

-- CreateIndex
CREATE INDEX "ocr_products_matched_product_id_idx" ON "ocr_products"("matched_product_id");

-- CreateIndex
CREATE INDEX "ocr_products_is_approved_idx" ON "ocr_products"("is_approved");

-- AddForeignKey
ALTER TABLE "ocr_scans" ADD CONSTRAINT "ocr_scans_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_scans" ADD CONSTRAINT "ocr_scans_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_products" ADD CONSTRAINT "ocr_products_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "ocr_scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_products" ADD CONSTRAINT "ocr_products_matched_product_id_fkey" FOREIGN KEY ("matched_product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
