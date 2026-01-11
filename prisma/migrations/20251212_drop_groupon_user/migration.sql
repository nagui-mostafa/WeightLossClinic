-- Drop foreign key if exists, then drop column user_id
ALTER TABLE "groupon_vouchers" DROP CONSTRAINT IF EXISTS "groupon_vouchers_userId_fkey";
ALTER TABLE "groupon_vouchers" DROP COLUMN IF EXISTS "userId";
