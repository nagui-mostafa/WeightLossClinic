-- Add optional tracking number to records for shipment tracking
ALTER TABLE "records"
ADD COLUMN IF NOT EXISTS "trackingNumber" VARCHAR(64);

-- Backfill existing rows with NULL (implicit) so no additional command is needed.
