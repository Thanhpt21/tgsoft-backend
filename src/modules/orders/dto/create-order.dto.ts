import {
  IsNotEmpty,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
  IsEnum,
  IsObject,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryMethod, OrderStatus, PaymentStatus } from '@prisma/client';

class OrderItemDto {
  @IsNumber()
  productVariantId: number;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsOptional()
  sku?: string;

  @IsOptional()
  @IsNumber()
  warehouseId?: number;

  @IsOptional()
  @IsNumber()
  giftProductId?: number | null;  // null nếu không có quà

  @IsOptional()
  @IsNumber()
  giftQuantity?: number;          // default 0 nếu không gửi
}

class ShippingInfoDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  note: string;

  @IsOptional()
  @IsNumber()
  city_id?: number;

  @IsOptional()
  @IsNumber()
  province_id?: number;

  @IsOptional()
  @IsNumber()
  district_id?: number;

  @IsOptional()
  @IsNumber()
  ward_id?: number;

  @IsOptional()
  @IsString()
  ward_name?: string;

  @IsOptional()
  @IsString()
  district_name?: string;

  @IsOptional()
  @IsString()
  province_name?: string;
}

export class CreateOrderDto {
  @IsNumber()
  @IsNotEmpty()
  tenantId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsObject()
  shippingInfo?: ShippingInfoDto;

    @IsNumber()
  @IsNotEmpty()
  totalAmount: number;

  @IsOptional()
  @IsNumber()
  paymentMethodId?: number; 

  @IsNumber()
  @IsNotEmpty()
  shippingFee: number;

  @IsOptional()
  @IsEnum(DeliveryMethod) // ✅ Dùng enum từ Prisma
  deliveryMethod?: DeliveryMethod;
}
