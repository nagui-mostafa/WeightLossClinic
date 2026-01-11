-- Add product category enum and column
CREATE TYPE "ProductCategory" AS ENUM ('WEIGHT_LOSS', 'SEXUAL_HEALTH', 'WELLNESS');

ALTER TABLE "weight_loss_products"
ADD COLUMN "category" "ProductCategory" NOT NULL DEFAULT 'WEIGHT_LOSS';

-- Backfill existing rows to default happens via default above

CREATE INDEX "weight_loss_products_category_idx" ON "weight_loss_products"("category");
