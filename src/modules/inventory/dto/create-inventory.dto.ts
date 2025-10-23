// src/modules/inventory/dto/create-inventory.dto.ts
import { IsInt, Min } from 'class-validator';

export class CreateInventoryDto {
  @IsInt()
  productVariantId: number;

  @IsInt()
  warehouseId: number;

  @IsInt()
  @Min(0)
  qty: number;
}
