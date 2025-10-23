// src/modules/warehouses/dto/update-warehouse.dto.ts
import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateWarehouseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  location?: Record<string, any>; // JSON

  @IsOptional()
  @IsString()
  code?: string;
}
