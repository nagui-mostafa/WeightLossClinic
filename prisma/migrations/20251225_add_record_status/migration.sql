-- Add RecordStatus enum and status column to records
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RecordStatus') THEN
    CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELED');
  END IF;
END$$;

ALTER TABLE "records"
ADD COLUMN IF NOT EXISTS "status" "RecordStatus" DEFAULT 'ACTIVE';

UPDATE "records" SET "status" = 'ACTIVE' WHERE "status" IS NULL;

ALTER TABLE "records" ALTER COLUMN "status" SET NOT NULL;
