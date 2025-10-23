import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateAttributeValueDto {
  @IsNumber()
  attributeId: number;

  @IsString()
  @IsNotEmpty()
  value: string;
}
