// src/modules/shipping-address/dto/update-shipping-address.dto.ts
import {
  IsOptional,
  IsString,
  IsInt,
  IsBoolean,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateShippingAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^0[3|5|7|8|9][0-9]{8}$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  // Chỉ validate nếu có gửi lên
  @ValidateIf((o) => o.province_id !== undefined)
  @IsInt()
  @Type(() => Number)
  province_id?: number;

  @ValidateIf((o) => o.province !== undefined)
  @IsString()
  province?: string;

  @ValidateIf((o) => o.district_id !== undefined)
  @IsInt()
  @Type(() => Number)
  district_id?: number;

  @ValidateIf((o) => o.district !== undefined)
  @IsString()
  district?: string;

  @ValidateIf((o) => o.ward_id !== undefined)
  @IsInt()
  @Type(() => Number)
  ward_id?: number;

  @ValidateIf((o) => o.ward !== undefined)
  @IsString()
  ward?: string;

  @IsOptional()
  @IsString()
  province_name?: string;

  @IsOptional()
  @IsString()
  district_name?: string;

  @IsOptional()
  @IsString()
  ward_name?: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}