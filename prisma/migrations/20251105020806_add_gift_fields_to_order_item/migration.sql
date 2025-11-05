-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "giftProductId" INTEGER,
ADD COLUMN     "giftQuantity" INTEGER DEFAULT 0;

-- CreateIndex
CREATE INDEX "OrderItem_giftProductId_idx" ON "OrderItem"("giftProductId");
