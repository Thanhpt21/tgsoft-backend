import { IsNumber, IsEnum, IsOptional, IsInt, IsPositive } from 'class-validator';
import { DiscountType } from '@prisma/client';

export class UpdatePromotionProductDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  promotionId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  productId?: number;

  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  discountValue?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  giftProductId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  giftQuantity?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  saleQuantity?: number;
}
