// src/modules/attributes/dto/update-attribute-value.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class UpdateAttributeValueDto {
  @IsOptional()
  @IsString()
  value?: string;
}
