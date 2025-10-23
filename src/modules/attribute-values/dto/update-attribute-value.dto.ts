import { IsOptional, IsString } from 'class-validator';

export class UpdateAttributeValueDto {
  @IsOptional()
  @IsString()
  value?: string;
}
