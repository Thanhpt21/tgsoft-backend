/*
  Warnings:

  - You are about to alter the column `name` on the `Promotion` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "Config" ALTER COLUMN "showAddress" SET DEFAULT true,
ALTER COLUMN "showEmail" SET DEFAULT true,
ALTER COLUMN "showMobile" SET DEFAULT true;

-- AlterTable
ALTER TABLE "Promotion" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "isFlashSale" DROP NOT NULL,
ALTER COLUMN "startTime" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "endTime" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "repeatCount" DROP NOT NULL,
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "createdAt" DROP NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(6);

-- AlterTable
ALTER TABLE "PromotionProduct" ALTER COLUMN "giftQuantity" DROP NOT NULL,
ALTER COLUMN "saleQuantity" DROP NOT NULL,
ALTER COLUMN "createdAt" DROP NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(6);
