import { IsDate, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class VariantAttributeValueResponseDto {
  @IsNumber()
  variantId: number;

  @IsNumber()
  attributeValueId: number;

  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @Type(() => Date)
  @IsDate()
  updatedAt: Date;

  constructor(partial: Partial<VariantAttributeValueResponseDto>) {
    Object.assign(this, partial);
  }
}
