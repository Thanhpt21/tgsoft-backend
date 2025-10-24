import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn } from 'class-validator';

export class CalculateFeeDto {
  @IsString()
  @IsNotEmpty()
  province: string;

  @IsString()
  @IsNotEmpty()
  district: string;

  @IsString()
  @IsOptional()
  ward?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  weight: number;

  @IsNumber()
  @IsOptional()
  value?: number;

  // Thay thế enum DeliverOption bằng IsIn
  @IsString()
  @IsOptional()
  @IsIn(['none', 'xteam'])
  deliver_option?: string;

  // Thay thế enum TransportOption bằng IsIn
  @IsString()
  @IsOptional()
  @IsIn(['road', 'fly'])
  transport?: string;
}

export class CreateGHTKOrderDto {
  @IsNumber()
  @IsNotEmpty()
  orderId: number;
}
