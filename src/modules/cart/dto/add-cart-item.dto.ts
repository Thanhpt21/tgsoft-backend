import { IsNumber, IsNotEmpty } from 'class-validator';

export class AddCartItemDto {
  @IsNumber()
  @IsNotEmpty()
  productVariantId: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  
}
