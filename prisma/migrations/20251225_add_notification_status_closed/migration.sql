-- Add CLOSED status to NotificationStatus enum and default existing rows to ACTIVE if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'NotificationStatus' AND e.enumlabel = 'CLOSED'
  ) THEN
    ALTER TYPE "NotificationStatus" ADD VALUE 'CLOSED';
  END IF;
END$$;
