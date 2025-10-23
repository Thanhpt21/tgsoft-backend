// src/modules/attributes/dto/create-attribute-value.dto.ts
import { IsNotEmpty, IsInt } from 'class-validator';

export class CreateAttributeValueDto {
  @IsInt()
  attributeId: number;

  @IsNotEmpty()
  value: string;
}
