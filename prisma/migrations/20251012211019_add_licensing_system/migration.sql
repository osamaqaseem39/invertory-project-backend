-- CreateEnum
CREATE TYPE "TrialStatus" AS ENUM ('ACTIVE', 'EXHAUSTED', 'ACTIVATED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'MONTHLY', 'YEARLY', 'PERPETUAL');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ActivationMethod" AS ENUM ('ONLINE', 'OFFLINE', 'MANUAL');

-- CreateTable
CREATE TABLE "trial_registry" (
    "id" UUID NOT NULL,
    "device_fingerprint" VARCHAR(64) NOT NULL,
    "hardware_signature" VARCHAR(128) NOT NULL,
    "trial_guest_id" VARCHAR(64) NOT NULL,
    "status" "TrialStatus" NOT NULL DEFAULT 'ACTIVE',
    "credits_allocated" INTEGER NOT NULL DEFAULT 50,
    "credits_used" INTEGER NOT NULL DEFAULT 0,
    "credits_remaining" INTEGER NOT NULL DEFAULT 50,
    "first_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trial_started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trial_exhausted_at" TIMESTAMPTZ,
    "activated_at" TIMESTAMPTZ,
    "ip_address" INET,
    "user_agent" TEXT,
    "country_code" VARCHAR(2),
    "timezone" VARCHAR(50),
    "license_key_id" UUID,
    "is_vm_detected" BOOLEAN NOT NULL DEFAULT false,
    "is_suspicious" BOOLEAN NOT NULL DEFAULT false,
    "reinstall_attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "trial_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hardware_fingerprints" (
    "id" UUID NOT NULL,
    "device_fingerprint" VARCHAR(64) NOT NULL,
    "hardware_signature" VARCHAR(128) NOT NULL,
    "mac_address" VARCHAR(17),
    "cpu_id" VARCHAR(64),
    "motherboard_serial" VARCHAR(64),
    "disk_serial" VARCHAR(64),
    "system_uuid" VARCHAR(64),
    "platform" VARCHAR(20) NOT NULL,
    "os_version" VARCHAR(50),
    "hostname" VARCHAR(255),
    "first_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seen_count" INTEGER NOT NULL DEFAULT 1,
    "is_virtual_machine" BOOLEAN NOT NULL DEFAULT false,
    "vm_type" VARCHAR(20),

    CONSTRAINT "hardware_fingerprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enhanced_license_keys" (
    "id" UUID NOT NULL,
    "license_key" VARCHAR(64) NOT NULL,
    "license_type" "LicenseType" NOT NULL DEFAULT 'STARTER',
    "status" "LicenseStatus" NOT NULL DEFAULT 'PENDING',
    "device_fingerprint" VARCHAR(64),
    "hardware_signature" VARCHAR(128),
    "max_activations" INTEGER NOT NULL DEFAULT 1,
    "activation_count" INTEGER NOT NULL DEFAULT 0,
    "customer_email" VARCHAR(255) NOT NULL,
    "customer_name" VARCHAR(255),
    "company_name" VARCHAR(255),
    "purchase_amount" DECIMAL(10,2),
    "currency" VARCHAR(3) DEFAULT 'USD',
    "payment_id" VARCHAR(255),
    "issued_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activated_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "activation_method" "ActivationMethod",
    "activation_ip" INET,
    "features_json" JSONB,
    "credit_limit" INTEGER,
    "jwt_token" TEXT,
    "public_key" TEXT,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMPTZ,
    "revocation_reason" TEXT,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "enhanced_license_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_activations" (
    "id" UUID NOT NULL,
    "license_key_id" UUID NOT NULL,
    "device_fingerprint" VARCHAR(64) NOT NULL,
    "hardware_signature" VARCHAR(128) NOT NULL,
    "activation_method" "ActivationMethod" NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "failure_reason" TEXT,
    "ip_address" INET,
    "user_agent" TEXT,
    "country_code" VARCHAR(2),
    "attempted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_suspicious" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "license_activations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_ledger_entries" (
    "id" UUID NOT NULL,
    "trial_registry_id" UUID,
    "user_id" UUID,
    "entry_type" VARCHAR(20) NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_before" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "reference_id" VARCHAR(64),
    "idempotency_key" VARCHAR(64) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suspicious_activities" (
    "id" UUID NOT NULL,
    "device_fingerprint" VARCHAR(64) NOT NULL,
    "hardware_signature" VARCHAR(128),
    "activity_type" VARCHAR(50) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "description" TEXT NOT NULL,
    "evidence_json" JSONB,
    "ip_address" INET,
    "action_taken" VARCHAR(50),
    "detected_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suspicious_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trial_registry_device_fingerprint_key" ON "trial_registry"("device_fingerprint");

-- CreateIndex
CREATE INDEX "trial_registry_device_fingerprint_idx" ON "trial_registry"("device_fingerprint");

-- CreateIndex
CREATE INDEX "trial_registry_hardware_signature_idx" ON "trial_registry"("hardware_signature");

-- CreateIndex
CREATE INDEX "trial_registry_status_idx" ON "trial_registry"("status");

-- CreateIndex
CREATE INDEX "trial_registry_trial_started_at_idx" ON "trial_registry"("trial_started_at");

-- CreateIndex
CREATE INDEX "trial_registry_is_suspicious_idx" ON "trial_registry"("is_suspicious");

-- CreateIndex
CREATE INDEX "hardware_fingerprints_device_fingerprint_idx" ON "hardware_fingerprints"("device_fingerprint");

-- CreateIndex
CREATE INDEX "hardware_fingerprints_hardware_signature_idx" ON "hardware_fingerprints"("hardware_signature");

-- CreateIndex
CREATE INDEX "hardware_fingerprints_mac_address_idx" ON "hardware_fingerprints"("mac_address");

-- CreateIndex
CREATE UNIQUE INDEX "enhanced_license_keys_license_key_key" ON "enhanced_license_keys"("license_key");

-- CreateIndex
CREATE INDEX "enhanced_license_keys_license_key_idx" ON "enhanced_license_keys"("license_key");

-- CreateIndex
CREATE INDEX "enhanced_license_keys_device_fingerprint_idx" ON "enhanced_license_keys"("device_fingerprint");

-- CreateIndex
CREATE INDEX "enhanced_license_keys_status_idx" ON "enhanced_license_keys"("status");

-- CreateIndex
CREATE INDEX "enhanced_license_keys_customer_email_idx" ON "enhanced_license_keys"("customer_email");

-- CreateIndex
CREATE INDEX "enhanced_license_keys_expires_at_idx" ON "enhanced_license_keys"("expires_at");

-- CreateIndex
CREATE INDEX "license_activations_license_key_id_idx" ON "license_activations"("license_key_id");

-- CreateIndex
CREATE INDEX "license_activations_device_fingerprint_idx" ON "license_activations"("device_fingerprint");

-- CreateIndex
CREATE INDEX "license_activations_attempted_at_idx" ON "license_activations"("attempted_at");

-- CreateIndex
CREATE UNIQUE INDEX "credit_ledger_entries_idempotency_key_key" ON "credit_ledger_entries"("idempotency_key");

-- CreateIndex
CREATE INDEX "credit_ledger_entries_trial_registry_id_idx" ON "credit_ledger_entries"("trial_registry_id");

-- CreateIndex
CREATE INDEX "credit_ledger_entries_user_id_idx" ON "credit_ledger_entries"("user_id");

-- CreateIndex
CREATE INDEX "credit_ledger_entries_created_at_idx" ON "credit_ledger_entries"("created_at");

-- CreateIndex
CREATE INDEX "credit_ledger_entries_idempotency_key_idx" ON "credit_ledger_entries"("idempotency_key");

-- CreateIndex
CREATE INDEX "suspicious_activities_device_fingerprint_idx" ON "suspicious_activities"("device_fingerprint");

-- CreateIndex
CREATE INDEX "suspicious_activities_activity_type_idx" ON "suspicious_activities"("activity_type");

-- CreateIndex
CREATE INDEX "suspicious_activities_severity_idx" ON "suspicious_activities"("severity");

-- CreateIndex
CREATE INDEX "suspicious_activities_detected_at_idx" ON "suspicious_activities"("detected_at");

-- AddForeignKey
ALTER TABLE "trial_registry" ADD CONSTRAINT "trial_registry_license_key_id_fkey" FOREIGN KEY ("license_key_id") REFERENCES "enhanced_license_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enhanced_license_keys" ADD CONSTRAINT "enhanced_license_keys_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_activations" ADD CONSTRAINT "license_activations_license_key_id_fkey" FOREIGN KEY ("license_key_id") REFERENCES "enhanced_license_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledger_entries" ADD CONSTRAINT "credit_ledger_entries_trial_registry_id_fkey" FOREIGN KEY ("trial_registry_id") REFERENCES "trial_registry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledger_entries" ADD CONSTRAINT "credit_ledger_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
