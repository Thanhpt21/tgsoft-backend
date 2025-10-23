// src/modules/warehouses/dto/create-warehouse.dto.ts
import { IsNotEmpty, IsInt, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateWarehouseDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsObject()
  location?: Record<string, any>; // JSON

  @IsString()
  @IsOptional()
  code?: string;
}
