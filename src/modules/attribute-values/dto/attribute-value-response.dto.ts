import { IsDate, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class AttributeValueResponseDto {
  @IsNumber()
  id: number;

  @IsNumber()
  attributeId: number;

  @IsString()
  value: string;

  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @Type(() => Date)
  @IsDate()
  updatedAt: Date;

  constructor(partial: Partial<AttributeValueResponseDto>) {
    Object.assign(this, partial);
  }
}