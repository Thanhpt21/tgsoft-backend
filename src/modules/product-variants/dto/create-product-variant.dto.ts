// src/modules/product-variants/dto/create-product-variant.dto.ts
import { IsNotEmpty, IsNumber, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateProductVariantDto {
  @IsNumber()
  productId: number;

  @IsString()
  sku: string;

  @IsNumber()
  @IsOptional()
  priceDelta?: number;

  @IsObject()
  attrValues: Record<string, string>; // { Color: 'Red', Size: 'M' }

  
  @IsOptional()
  @IsString()   // barcode là string
  barcode?: string;
}
