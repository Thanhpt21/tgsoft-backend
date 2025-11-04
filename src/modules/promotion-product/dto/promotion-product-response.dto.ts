import { DiscountType } from "@prisma/client";

export class PromotionProductResponseDto {
  id: number;
  promotionId: number;
  productId: number;
  discountType: DiscountType;
  discountValue: number;
  giftProductId: number | null;
  giftQuantity: number | null; // Allow null
  saleQuantity: number | null; // Allow null
  createdAt: Date | null;
  updatedAt: Date | null;

  constructor(partial: Partial<PromotionProductResponseDto>) {
    Object.assign(this, partial);
  }
}
