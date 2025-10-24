
import { IsNotEmpty, IsOptional, IsInt, Min, IsEnum } from 'class-validator';

export class CreateAttributeDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  position?: number; // Thứ tự hiển thị


}

