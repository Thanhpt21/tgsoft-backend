import { IsNumber, IsEnum, IsOptional, IsInt, IsPositive } from 'class-validator';
import { DiscountType } from '@prisma/client';

export class CreatePromotionProductDto {
  @IsInt()
  @IsPositive()
  promotionId: number;

  @IsInt()
  @IsPositive()
  productId: number;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber()
  @IsPositive()
  discountValue: number;

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
