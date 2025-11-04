/*
  Warnings:

  - You are about to drop the `ProductDiscount` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'ENDED');

-- DropForeignKey
ALTER TABLE "public"."ProductDiscount" DROP CONSTRAINT "ProductDiscount_productId_fkey";

-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "showAddress" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showFacebook" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showGooglemap" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showInstagram" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showLinkedin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showMobile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showTiktok" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showX" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showYoutube" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showZalo" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "public"."ProductDiscount";

-- CreateTable
CREATE TABLE "Promotion" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isFlashSale" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "repeatCount" INTEGER NOT NULL DEFAULT 1,
    "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionProduct" (
    "id" SERIAL NOT NULL,
    "promotionId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "giftProductId" INTEGER,
    "giftQuantity" INTEGER NOT NULL DEFAULT 0,
    "saleQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionProduct_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionProduct" ADD CONSTRAINT "PromotionProduct_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionProduct" ADD CONSTRAINT "PromotionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionProduct" ADD CONSTRAINT "PromotionProduct_giftProductId_fkey" FOREIGN KEY ("giftProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
