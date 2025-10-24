
import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';

export class UpdateAttributeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  position?: number;

}
