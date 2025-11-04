import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { PromotionStatus } from '@prisma/client';

export class CreatePromotionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isFlashSale?: boolean;

  @IsDateString()
  startTime: string; // phải có

  @IsDateString()
  endTime: string; // phải có

  @IsOptional()
  @IsNumber()
  repeatCount?: number;

  @IsOptional()
  @IsEnum(PromotionStatus)
  status?: PromotionStatus;
}
