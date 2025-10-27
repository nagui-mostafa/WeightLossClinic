/*
  Warnings:

  - You are about to drop the column `medicationName` on the `records` table. All the data in the column will be lost.
  - You are about to drop the column `currentWeight` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `goalWeight` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `weightDose` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `weightLoss` on the `users` table. All the data in the column will be lost.
  - Added the required column `medication` to the `records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchasedAt` to the `records` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ActivityKind" AS ENUM ('INJECTION', 'WEIGHT', 'WORKOUT', 'MESSAGE', 'RECORD', 'SHOT', 'NOTE');

-- DropForeignKey
ALTER TABLE "public"."audit_logs" DROP CONSTRAINT "audit_logs_actorUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."audit_logs" DROP CONSTRAINT "audit_logs_targetUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."email_verification_tokens" DROP CONSTRAINT "email_verification_tokens_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."password_reset_tokens" DROP CONSTRAINT "password_reset_tokens_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."records" DROP CONSTRAINT "records_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."refresh_sessions" DROP CONSTRAINT "refresh_sessions_userId_fkey";

-- DropIndex
DROP INDEX "public"."records_medication_type_idx";

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "email_verification_tokens" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "password_reset_tokens" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "records" DROP COLUMN "medicationName",
ADD COLUMN     "medication" VARCHAR(200) NOT NULL,
ADD COLUMN     "purchasedAt" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "renewalDate" TIMESTAMPTZ(6),
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "startDate" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "endDate" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "medicationType" DROP NOT NULL;

-- AlterTable
ALTER TABLE "refresh_sessions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "currentWeight",
DROP COLUMN "goalWeight",
DROP COLUMN "weightDose",
DROP COLUMN "weightLoss",
ADD COLUMN     "avatarUrl" VARCHAR(255),
ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "user_shipping" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "fullName" VARCHAR(150) NOT NULL,
    "address1" VARCHAR(200) NOT NULL,
    "address2" VARCHAR(200),
    "city" VARCHAR(120) NOT NULL,
    "state" VARCHAR(120) NOT NULL,
    "postalCode" VARCHAR(20) NOT NULL,
    "country" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(30),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_shipping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_snapshots" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "currentWeightLbs" DECIMAL(6,2),
    "goalWeightLbs" DECIMAL(6,2),
    "medicationType" VARCHAR(150),
    "doseName" VARCHAR(150),
    "doseValue" DECIMAL(6,2),
    "doseUnit" VARCHAR(50),
    "nextAppointmentId" VARCHAR(100),
    "nextAppointmentStartsAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activities" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "ActivityKind" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "subtitle" VARCHAR(250),
    "occurredAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_shots" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "date" TIMESTAMPTZ(6) NOT NULL,
    "medication" VARCHAR(150) NOT NULL,
    "doseValue" DECIMAL(6,2),
    "doseUnit" VARCHAR(50),
    "site" VARCHAR(200),
    "painLevel" INTEGER,
    "weightKg" DECIMAL(6,2),
    "caloriesAvg" INTEGER,
    "proteinAvgG" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_shots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_shipping_userId_key" ON "user_shipping"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_snapshots_userId_key" ON "user_snapshots"("userId");

-- CreateIndex
CREATE INDEX "user_activity_user_occurred_idx" ON "user_activities"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "user_shots_user_date_idx" ON "user_shots"("userId", "date");

-- AddForeignKey
ALTER TABLE "user_shipping" ADD CONSTRAINT "user_shipping_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_snapshots" ADD CONSTRAINT "user_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_shots" ADD CONSTRAINT "user_shots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
