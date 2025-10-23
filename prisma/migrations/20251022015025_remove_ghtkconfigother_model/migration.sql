/*
  Warnings:

  - You are about to drop the `GHTKConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShippingFee` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `shippingFee` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."GHTKConfig" DROP CONSTRAINT "GHTKConfig_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShippingFee" DROP CONSTRAINT "ShippingFee_ghtkConfigId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShippingFee" DROP CONSTRAINT "ShippingFee_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShippingFee" DROP CONSTRAINT "ShippingFee_tenantId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingFee" DOUBLE PRECISION NOT NULL;

-- DropTable
DROP TABLE "public"."GHTKConfig";

-- DropTable
DROP TABLE "public"."ShippingFee";
