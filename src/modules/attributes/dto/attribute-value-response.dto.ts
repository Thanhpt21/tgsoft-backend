// src/modules/attributes/dto/attribute-value-response.dto.ts
export class AttributeValueResponseDto {
  id: number;
  attributeId: number;
  value: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<AttributeValueResponseDto>) {
    Object.assign(this, partial);
  }
}
