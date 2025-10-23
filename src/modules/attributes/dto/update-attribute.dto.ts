// src/modules/attributes/dto/update-attribute.dto.ts
import { AttributeType } from '@prisma/client';
import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';

export class UpdateAttributeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  position?: number;

  @IsOptional()
  @IsEnum(AttributeType)
  type?: AttributeType; // cho phép cập nhật type
}
