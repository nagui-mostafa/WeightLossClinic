-- Add optional category to records (no backfill).

ALTER TABLE "records"
ADD COLUMN "category" "ProductCategory";
