-- CreateEnum
CREATE TYPE "GrouponVoucherStatus" AS ENUM ('RESERVED', 'REDEEMED', 'RELEASED');

-- CreateTable
CREATE TABLE "groupon_vouchers" (
    "id" UUID NOT NULL,
    "recordId" UUID,
    "userId" UUID,
    "grouponCode" VARCHAR(100),
    "redemptionCode" VARCHAR(120) NOT NULL,
    "status" "GrouponVoucherStatus" NOT NULL DEFAULT 'RESERVED',
    "optionId" VARCHAR(120),
    "optionTitle" VARCHAR(255),
    "dealId" VARCHAR(120),
    "dealTitle" VARCHAR(255),
    "priceAmount" INTEGER,
    "priceCurrency" VARCHAR(10),
    "valueAmount" INTEGER,
    "valueCurrency" VARCHAR(10),
    "reservationExpiresAt" TIMESTAMPTZ(6),
    "redeemedAt" TIMESTAMPTZ(6),
    "rawPayload" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groupon_vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "groupon_vouchers_recordId_key" ON "groupon_vouchers"("recordId");

-- CreateIndex
CREATE UNIQUE INDEX "groupon_vouchers_redemptionCode_key" ON "groupon_vouchers"("redemptionCode");

-- CreateIndex
CREATE INDEX "groupon_vouchers_status_idx" ON "groupon_vouchers"("status");

-- CreateIndex
CREATE INDEX "groupon_vouchers_res_exp_idx" ON "groupon_vouchers"("reservationExpiresAt");

-- AddForeignKey
ALTER TABLE "groupon_vouchers" ADD CONSTRAINT "groupon_vouchers_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groupon_vouchers" ADD CONSTRAINT "groupon_vouchers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
