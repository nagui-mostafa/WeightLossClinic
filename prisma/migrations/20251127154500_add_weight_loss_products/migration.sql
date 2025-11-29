-- CreateTable
CREATE TABLE "weight_loss_products" (
    "id" UUID NOT NULL,
    "token" VARCHAR(160) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "href" VARCHAR(255) NOT NULL,
    "hrefForm" VARCHAR(255),
    "oldPrice" DECIMAL(10,2),
    "price" DECIMAL(10,2) NOT NULL,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "badge" VARCHAR(255),
    "description" TEXT,
    "shipping" VARCHAR(255),
    "instructions" TEXT,
    "sideEffects" TEXT,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "whyChoose" JSONB,
    "plan" JSONB,
    "question" JSONB,
    "howItWorks" JSONB,
    "images" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weight_loss_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weight_loss_products_token_key" ON "weight_loss_products"("token");

-- CreateIndex
CREATE INDEX "weight_loss_products_popular_idx" ON "weight_loss_products"("popular");

-- CreateIndex
CREATE INDEX "weight_loss_products_in_stock_idx" ON "weight_loss_products"("inStock");

-- CreateIndex
CREATE INDEX "weight_loss_products_created_idx" ON "weight_loss_products"("createdAt");
