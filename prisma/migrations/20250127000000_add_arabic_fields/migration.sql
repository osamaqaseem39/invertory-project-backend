-- Add Arabic fields to support bilingual content

-- Add Arabic fields to products table
ALTER TABLE "products" 
ADD COLUMN "name_ar" TEXT,
ADD COLUMN "description_ar" TEXT,
ADD COLUMN "brand_ar" TEXT;

-- Add Arabic fields to categories table
ALTER TABLE "categories" 
ADD COLUMN "name_ar" VARCHAR(100),
ADD COLUMN "description_ar" TEXT;

-- Add Arabic fields to suppliers table
ALTER TABLE "suppliers" 
ADD COLUMN "name_ar" VARCHAR(200),
ADD COLUMN "contact_person_ar" VARCHAR(100),
ADD COLUMN "address_ar" TEXT;

-- Add Arabic fields to customers table
ALTER TABLE "customers" 
ADD COLUMN "first_name_ar" VARCHAR(100),
ADD COLUMN "last_name_ar" VARCHAR(100),
ADD COLUMN "company_name_ar" VARCHAR(200),
ADD COLUMN "address_line1_ar" VARCHAR(255),
ADD COLUMN "address_line2_ar" VARCHAR(255);

-- Add Arabic fields to branding table
ALTER TABLE "branding_profiles" 
ADD COLUMN "tagline_ar" VARCHAR(255),
ADD COLUMN "business_address_ar" TEXT,
ADD COLUMN "receipt_header_text_ar" TEXT,
ADD COLUMN "receipt_footer_text_ar" TEXT;

-- Add indexes for Arabic fields
CREATE INDEX "products_name_ar_idx" ON "products"("name_ar");
CREATE INDEX "categories_name_ar_idx" ON "categories"("name_ar");
CREATE INDEX "suppliers_name_ar_idx" ON "suppliers"("name_ar");
CREATE INDEX "customers_first_name_ar_idx" ON "customers"("first_name_ar");
CREATE INDEX "customers_last_name_ar_idx" ON "customers"("last_name_ar");
CREATE INDEX "customers_company_name_ar_idx" ON "customers"("company_name_ar");
