/*
  Warnings:

  - You are about to drop the `GHTKShipment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GHTKShipmentProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GHTKTrackingHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."GHTKShipment" DROP CONSTRAINT "GHTKShipment_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GHTKShipmentProduct" DROP CONSTRAINT "GHTKShipmentProduct_shipmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GHTKTrackingHistory" DROP CONSTRAINT "GHTKTrackingHistory_shipmentId_fkey";

-- DropTable
DROP TABLE "public"."GHTKShipment";

-- DropTable
DROP TABLE "public"."GHTKShipmentProduct";

-- DropTable
DROP TABLE "public"."GHTKTrackingHistory";
