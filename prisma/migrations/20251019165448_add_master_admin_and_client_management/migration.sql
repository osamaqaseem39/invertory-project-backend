-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED', 'TRIAL');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('CREDIT_REQUEST', 'SUPPORT_REQUEST', 'STATUS_UPDATE', 'BILLING_QUERY', 'TECHNICAL_ISSUE');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MessagePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'master_admin';

-- CreateTable
CREATE TABLE "client_instances" (
    "id" UUID NOT NULL,
    "client_name" VARCHAR(255) NOT NULL,
    "client_code" VARCHAR(50) NOT NULL,
    "device_fingerprint" VARCHAR(64) NOT NULL,
    "hardware_signature" VARCHAR(128) NOT NULL,
    "status" "ClientStatus" NOT NULL DEFAULT 'TRIAL',
    "trial_guest_id" VARCHAR(64),
    "license_key_id" UUID,
    "contact_email" VARCHAR(255) NOT NULL,
    "contact_phone" VARCHAR(50),
    "company_name" VARCHAR(255),
    "country" VARCHAR(2),
    "timezone" VARCHAR(50),
    "first_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_sync_at" TIMESTAMPTZ,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "client_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_usage_stats" (
    "id" UUID NOT NULL,
    "client_instance_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "credits_consumed" INTEGER NOT NULL DEFAULT 0,
    "invoices_created" INTEGER NOT NULL DEFAULT 0,
    "sales_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "active_users" INTEGER NOT NULL DEFAULT 0,
    "login_count" INTEGER NOT NULL DEFAULT 0,
    "sync_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_usage_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_messages" (
    "id" UUID NOT NULL,
    "client_instance_id" UUID NOT NULL,
    "message_type" "MessageType" NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "message_content" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "MessagePriority" NOT NULL DEFAULT 'MEDIUM',
    "response_content" TEXT,
    "responded_by_id" UUID,
    "responded_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "client_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_notifications" (
    "id" UUID NOT NULL,
    "client_instance_id" UUID NOT NULL,
    "notification_type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_instances_client_code_key" ON "client_instances"("client_code");

-- CreateIndex
CREATE UNIQUE INDEX "client_instances_device_fingerprint_key" ON "client_instances"("device_fingerprint");

-- CreateIndex
CREATE INDEX "client_instances_client_code_idx" ON "client_instances"("client_code");

-- CreateIndex
CREATE INDEX "client_instances_device_fingerprint_idx" ON "client_instances"("device_fingerprint");

-- CreateIndex
CREATE INDEX "client_instances_status_idx" ON "client_instances"("status");

-- CreateIndex
CREATE INDEX "client_instances_contact_email_idx" ON "client_instances"("contact_email");

-- CreateIndex
CREATE INDEX "client_instances_created_by_id_idx" ON "client_instances"("created_by_id");

-- CreateIndex
CREATE INDEX "client_instances_last_seen_at_idx" ON "client_instances"("last_seen_at");

-- CreateIndex
CREATE INDEX "client_usage_stats_client_instance_id_idx" ON "client_usage_stats"("client_instance_id");

-- CreateIndex
CREATE INDEX "client_usage_stats_date_idx" ON "client_usage_stats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "client_usage_stats_client_instance_id_date_key" ON "client_usage_stats"("client_instance_id", "date");

-- CreateIndex
CREATE INDEX "client_messages_client_instance_id_idx" ON "client_messages"("client_instance_id");

-- CreateIndex
CREATE INDEX "client_messages_message_type_idx" ON "client_messages"("message_type");

-- CreateIndex
CREATE INDEX "client_messages_status_idx" ON "client_messages"("status");

-- CreateIndex
CREATE INDEX "client_messages_priority_idx" ON "client_messages"("priority");

-- CreateIndex
CREATE INDEX "client_messages_created_at_idx" ON "client_messages"("created_at");

-- CreateIndex
CREATE INDEX "client_notifications_client_instance_id_idx" ON "client_notifications"("client_instance_id");

-- CreateIndex
CREATE INDEX "client_notifications_is_read_idx" ON "client_notifications"("is_read");

-- CreateIndex
CREATE INDEX "client_notifications_created_at_idx" ON "client_notifications"("created_at");

-- AddForeignKey
ALTER TABLE "client_instances" ADD CONSTRAINT "client_instances_license_key_id_fkey" FOREIGN KEY ("license_key_id") REFERENCES "enhanced_license_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_instances" ADD CONSTRAINT "client_instances_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_usage_stats" ADD CONSTRAINT "client_usage_stats_client_instance_id_fkey" FOREIGN KEY ("client_instance_id") REFERENCES "client_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_messages" ADD CONSTRAINT "client_messages_client_instance_id_fkey" FOREIGN KEY ("client_instance_id") REFERENCES "client_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_messages" ADD CONSTRAINT "client_messages_responded_by_id_fkey" FOREIGN KEY ("responded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_notifications" ADD CONSTRAINT "client_notifications_client_instance_id_fkey" FOREIGN KEY ("client_instance_id") REFERENCES "client_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
