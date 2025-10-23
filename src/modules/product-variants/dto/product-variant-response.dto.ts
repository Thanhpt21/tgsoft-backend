import { JsonValue } from "@prisma/client/runtime/library";

export class ProductVariantResponseDto {
  id: number;
  productId: number;
  sku: string;
  barcode?: string | null;  
  priceDelta: number;
  attrValues: Record<string, string>;
  thumb?: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(variant: {
    id: number;
    productId: number;
    sku: string;
    barcode?: string | null;   
    priceDelta: number;
    attrValues: JsonValue;
      thumb?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = variant.id;
    this.productId = variant.productId;
    this.sku = variant.sku;
    this.barcode = variant.barcode ?? null;  
    this.priceDelta = variant.priceDelta;
    this.createdAt = variant.createdAt;
    this.updatedAt = variant.updatedAt;
    this.thumb = variant.thumb ?? null;
    // ép kiểu, nếu null thì thành object rỗng
    this.attrValues = (variant.attrValues as Record<string, string>) ?? {};
  }
}
