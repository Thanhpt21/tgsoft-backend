import { IsOptional, IsNumber } from 'class-validator';

export class UpdateVariantAttributeValueDto {
  @IsOptional()
  @IsNumber()
  variantId?: number;

  @IsOptional()
  @IsNumber()
  attributeValueId?: number;
}
