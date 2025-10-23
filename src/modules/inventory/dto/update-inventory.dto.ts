// src/modules/inventory/dto/update-inventory.dto.ts
import { IsOptional, IsInt, Min } from 'class-validator';

export class UpdateInventoryDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  qty?: number;
}
