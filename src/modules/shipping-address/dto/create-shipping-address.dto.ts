// src/modules/shipping-address/dto/create-shipping-address.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
  Matches,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShippingAddressDto {
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString({ message: 'Họ tên phải là chuỗi' })
  @MaxLength(100, { message: 'Họ tên không được vượt quá 100 ký tự' })
  name: string;

  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @Matches(/^0[3|5|7|8|9][0-9]{8}$/, {
    message: 'Số điện thoại không hợp lệ (vd: 0901234567)',
  })
  phone: string;

  @IsNotEmpty({ message: 'Địa chỉ chi tiết không được để trống' })
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  @MaxLength(255, { message: 'Địa chỉ không được vượt quá 255 ký tự' })
  address: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Ghi chú không được vượt quá 500 ký tự' })
  note?: string;

  @IsNotEmpty({ message: 'Mã tỉnh/thành phố là bắt buộc' })
  @IsInt({ message: 'Mã tỉnh/thành phố phải là số nguyên' })
  @Type(() => Number)
  province_id: number;

  @IsNotEmpty({ message: 'Tên tỉnh/thành phố là bắt buộc' })
  @IsString()
  province: string;

  @IsNotEmpty({ message: 'Mã quận/huyện là bắt buộc' })
  @IsInt()
  @Type(() => Number)
  district_id: number;

  @IsNotEmpty({ message: 'Tên quận/huyện là bắt buộc' })
  @IsString()
  district: string;

  @IsNotEmpty({ message: 'Mã phường/xã là bắt buộc' })
  @IsInt()
  @Type(() => Number)
  ward_id: number;

  @IsNotEmpty({ message: 'Tên phường/xã là bắt buộc' })
  @IsString()
  ward: string;

  @IsOptional()
  @IsString()
  province_name?: string;

  @IsOptional()
  @IsString()
  district_name?: string;

  @IsOptional()
  @IsString()
  ward_name?: string;

  // --- Mặc định ---
  @IsOptional()
  @IsBoolean({ message: 'is_default phải là true/false' })
  is_default?: boolean = false;
}