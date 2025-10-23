-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('STANDARD', 'XTEAM');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryMethod" "DeliveryMethod" NOT NULL DEFAULT 'STANDARD';
