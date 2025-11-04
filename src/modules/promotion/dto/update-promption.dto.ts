import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { PromotionStatus } from '@prisma/client';

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isFlashSale?: boolean;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  repeatCount?: number;

  @IsOptional()
  @IsEnum(PromotionStatus)
  status?: PromotionStatus;
}
