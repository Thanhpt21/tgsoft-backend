import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateVariantAttributeValueDto {
  @IsNumber()
  @IsNotEmpty()
  variantId: number;

  @IsNumber()
  @IsNotEmpty()
  attributeValueId: number;
}
