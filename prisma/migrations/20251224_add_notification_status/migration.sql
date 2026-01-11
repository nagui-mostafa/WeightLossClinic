-- Add status column and enum for user notifications
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationStatus') THEN
    CREATE TYPE "NotificationStatus" AS ENUM ('ACTIVE', 'PROCESSING');
  END IF;
END$$;

ALTER TABLE "user_notifications"
ADD COLUMN IF NOT EXISTS "status" "NotificationStatus" DEFAULT 'ACTIVE';

UPDATE "user_notifications" SET "status" = 'ACTIVE' WHERE "status" IS NULL;

ALTER TABLE "user_notifications" ALTER COLUMN "status" SET NOT NULL;
