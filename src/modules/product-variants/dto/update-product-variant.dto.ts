// src/modules/product-variants/dto/update-product-variant.dto.ts
import { IsOptional, IsString, IsNumber, IsObject } from 'class-validator';

export class UpdateProductVariantDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber()
  priceDelta?: number;

  @IsOptional()
  @IsObject()
  attrValues?: Record<string, string>;

  
  @IsOptional()
  @IsString()   // barcode là string
  barcode?: string;
}
