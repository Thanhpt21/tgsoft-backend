export class ProductReviewResponseDto {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  orderId?: number | null;
  orderItemId?: number | null;
  isPurchased: boolean;
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ProductReviewResponseDto>) {
    Object.assign(this, partial);
  }
}