import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ClientCartItemDto } from './client-cart-item.dto';

export class MergeCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClientCartItemDto)
  items: ClientCartItemDto[];
}
