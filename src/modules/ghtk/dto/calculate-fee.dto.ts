import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';

export enum GHTKPickOption {
  COD = 'cod',
  POST = 'post',
}

export enum GHTKDeliverOption {
  NONE = 'none',
  XTEAM = 'xteam',
}

export enum GHTKTransportOption {
  ROAD = 'road',
  FLY = 'fly',
}

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

  @IsEnum(GHTKDeliverOption)
  @IsOptional()
  deliver_option?: GHTKDeliverOption;


  @IsEnum(GHTKTransportOption)
  @IsOptional()
  transport?: GHTKTransportOption;
}

export class CreateGHTKOrderDto {
  @IsNumber()
  @IsNotEmpty()
  orderId: number;
}