import { IsOptional, IsInt, IsString, IsEnum } from 'class-validator';
import { RefundStatus } from '@prisma/client';

export class UpdateRefundDto {
  @IsOptional()
  @IsInt()
  amount?: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(RefundStatus)
  status?: RefundStatus;
}
