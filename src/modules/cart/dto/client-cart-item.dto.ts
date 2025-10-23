import { IsNumber } from 'class-validator';

export class ClientCartItemDto {
  @IsNumber()
  productVariantId: number;

  @IsNumber()
  quantity: number;
}
