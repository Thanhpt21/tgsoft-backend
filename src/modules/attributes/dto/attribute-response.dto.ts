// src/modules/attributes/dto/attribute-response.dto.ts
export class AttributeResponseDto {
  id: number;
  name: string;
  position: number;
  type: string; 
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<AttributeResponseDto>) {
    Object.assign(this, partial);
  }
}
