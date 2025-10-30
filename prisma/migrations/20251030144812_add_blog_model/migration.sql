-- CreateTable
CREATE TABLE "blogs" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "excerpt" VARCHAR(400) NOT NULL,
    "category" VARCHAR(120) NOT NULL,
    "imgSrc" VARCHAR(255) NOT NULL,
    "body" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blogs_token_key" ON "blogs"("token");

-- CreateIndex
CREATE INDEX "blogs_token_idx" ON "blogs"("token");
