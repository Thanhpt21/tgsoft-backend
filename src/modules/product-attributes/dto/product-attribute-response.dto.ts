export class ProductAttributeResponseDto {
  productId: number;
  attributeId: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ProductAttributeResponseDto>) {
    Object.assign(this, partial);
  }
}
