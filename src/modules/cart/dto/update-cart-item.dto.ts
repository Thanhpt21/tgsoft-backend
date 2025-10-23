import { IsNumber, IsOptional } from 'class-validator';

export class UpdateCartItemDto {
  @IsNumber()
  @IsOptional()
  quantity?: number;
}
