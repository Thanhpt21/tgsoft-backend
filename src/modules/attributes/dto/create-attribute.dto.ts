
import { AttributeType } from '@prisma/client';
import { IsNotEmpty, IsOptional, IsInt, Min, IsEnum } from 'class-validator';

export class CreateAttributeDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  position?: number; // Thứ tự hiển thị

  @IsEnum(AttributeType)
  type: AttributeType; // bắt buộc chọn type khi tạo

}

