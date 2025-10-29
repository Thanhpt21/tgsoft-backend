-- AlterTable
ALTER TABLE "ProductReview" ADD COLUMN     "isPurchased" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "orderId" INTEGER,
ADD COLUMN     "orderItemId" INTEGER;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
