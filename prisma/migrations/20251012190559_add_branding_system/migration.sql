-- CreateEnum
CREATE TYPE "ThemeMode" AS ENUM ('LIGHT', 'DARK', 'AUTO');

-- CreateEnum
CREATE TYPE "LogoPosition" AS ENUM ('LEFT', 'CENTER', 'RIGHT');

-- CreateEnum
CREATE TYPE "FontFamily" AS ENUM ('INTER', 'ROBOTO', 'OPEN_SANS', 'LATO', 'POPPINS', 'CAIRO', 'AMIRI');

-- CreateTable
CREATE TABLE "branding_profiles" (
    "id" UUID NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "company_name_ar" VARCHAR(255),
    "tagline" VARCHAR(255),
    "business_address" TEXT,
    "business_phone" VARCHAR(50),
    "business_email" VARCHAR(255),
    "business_website" VARCHAR(255),
    "tax_id" VARCHAR(100),
    "logo_original" TEXT,
    "logo_header" TEXT,
    "logo_receipt" TEXT,
    "logo_pdf" TEXT,
    "logo_email" TEXT,
    "logo_thumbnail" TEXT,
    "logo_base64" TEXT,
    "favicon_32" TEXT,
    "favicon_16" TEXT,
    "primary_color" VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    "secondary_color" VARCHAR(7) NOT NULL DEFAULT '#8B5CF6',
    "accent_color" VARCHAR(7) NOT NULL DEFAULT '#EC4899',
    "success_color" VARCHAR(7) NOT NULL DEFAULT '#10B981',
    "warning_color" VARCHAR(7) NOT NULL DEFAULT '#F59E0B',
    "error_color" VARCHAR(7) NOT NULL DEFAULT '#EF4444',
    "color_palette" JSONB,
    "font_family" "FontFamily" NOT NULL DEFAULT 'INTER',
    "font_family_custom" VARCHAR(100),
    "heading_font" VARCHAR(100),
    "body_font" VARCHAR(100),
    "theme_mode" "ThemeMode" NOT NULL DEFAULT 'LIGHT',
    "generated_css" TEXT,
    "css_version" INTEGER NOT NULL DEFAULT 1,
    "receipt_header_text" TEXT,
    "receipt_footer_text" TEXT,
    "receipt_logo_position" "LogoPosition" NOT NULL DEFAULT 'CENTER',
    "receipt_logo_size" INTEGER NOT NULL DEFAULT 200,
    "show_logo_on_receipt" BOOLEAN NOT NULL DEFAULT true,
    "invoice_template" VARCHAR(50) NOT NULL DEFAULT 'modern',
    "invoice_header_color" VARCHAR(7),
    "invoice_watermark" VARCHAR(100),
    "show_watermark" BOOLEAN NOT NULL DEFAULT false,
    "watermark_opacity" INTEGER NOT NULL DEFAULT 10,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" UUID NOT NULL,
    "updated_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "branding_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theme_presets" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "preview_image" TEXT,
    "primary_color" VARCHAR(7) NOT NULL,
    "secondary_color" VARCHAR(7) NOT NULL,
    "accent_color" VARCHAR(7) NOT NULL,
    "is_builtin" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "theme_presets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "branding_profiles_is_active_idx" ON "branding_profiles"("is_active");

-- CreateIndex
CREATE INDEX "branding_profiles_is_default_idx" ON "branding_profiles"("is_default");

-- CreateIndex
CREATE INDEX "theme_presets_is_builtin_idx" ON "theme_presets"("is_builtin");

-- CreateIndex
CREATE INDEX "theme_presets_is_public_idx" ON "theme_presets"("is_public");

-- AddForeignKey
ALTER TABLE "branding_profiles" ADD CONSTRAINT "branding_profiles_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branding_profiles" ADD CONSTRAINT "branding_profiles_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theme_presets" ADD CONSTRAINT "theme_presets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
