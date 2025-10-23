-- AlterTable
ALTER TABLE "enhanced_license_keys" ADD COLUMN     "client_instance_id" UUID,
ADD COLUMN     "current_credits" INTEGER,
ADD COLUMN     "features" TEXT,
ADD COLUMN     "max_credits" INTEGER;

-- CreateTable
CREATE TABLE "credit_purchases" (
    "id" UUID NOT NULL,
    "client_instance_id" UUID NOT NULL,
    "credit_pack" VARCHAR(50) NOT NULL,
    "credits_purchased" INTEGER NOT NULL,
    "price_per_credit" DECIMAL(10,4) NOT NULL,
    "total_cost" DECIMAL(10,2) NOT NULL,
    "payment_method" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "credit_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_records" (
    "id" UUID NOT NULL,
    "client_instance_id" UUID NOT NULL,
    "billing_type" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "payment_method" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "paid_amount" DECIMAL(10,2),
    "transaction_id" VARCHAR(255),
    "due_date" TIMESTAMPTZ,
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "billing_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_records" (
    "id" UUID NOT NULL,
    "billing_record_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method" VARCHAR(50) NOT NULL,
    "transaction_id" VARCHAR(255) NOT NULL,
    "processed_by_id" UUID NOT NULL,
    "processed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credit_purchases_client_instance_id_idx" ON "credit_purchases"("client_instance_id");

-- CreateIndex
CREATE INDEX "credit_purchases_credit_pack_idx" ON "credit_purchases"("credit_pack");

-- CreateIndex
CREATE INDEX "credit_purchases_status_idx" ON "credit_purchases"("status");

-- CreateIndex
CREATE INDEX "credit_purchases_created_at_idx" ON "credit_purchases"("created_at");

-- CreateIndex
CREATE INDEX "billing_records_client_instance_id_idx" ON "billing_records"("client_instance_id");

-- CreateIndex
CREATE INDEX "billing_records_billing_type_idx" ON "billing_records"("billing_type");

-- CreateIndex
CREATE INDEX "billing_records_status_idx" ON "billing_records"("status");

-- CreateIndex
CREATE INDEX "billing_records_due_date_idx" ON "billing_records"("due_date");

-- CreateIndex
CREATE INDEX "billing_records_created_at_idx" ON "billing_records"("created_at");

-- CreateIndex
CREATE INDEX "payment_records_billing_record_id_idx" ON "payment_records"("billing_record_id");

-- CreateIndex
CREATE INDEX "payment_records_payment_method_idx" ON "payment_records"("payment_method");

-- CreateIndex
CREATE INDEX "payment_records_processed_at_idx" ON "payment_records"("processed_at");

-- AddForeignKey
ALTER TABLE "credit_purchases" ADD CONSTRAINT "credit_purchases_client_instance_id_fkey" FOREIGN KEY ("client_instance_id") REFERENCES "client_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_records" ADD CONSTRAINT "billing_records_client_instance_id_fkey" FOREIGN KEY ("client_instance_id") REFERENCES "client_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_billing_record_id_fkey" FOREIGN KEY ("billing_record_id") REFERENCES "billing_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_processed_by_id_fkey" FOREIGN KEY ("processed_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
