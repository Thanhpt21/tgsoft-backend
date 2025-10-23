/*
  Warnings:

  - Added the required column `fee` to the `Shipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `service` to the `Shipment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ShippingService" AS ENUM ('STANDARD', 'EXPRESS', 'OVERNIGHT');

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "fee" INTEGER NOT NULL,
ADD COLUMN     "service" TEXT NOT NULL;
