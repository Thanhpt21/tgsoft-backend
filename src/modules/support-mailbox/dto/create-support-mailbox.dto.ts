import { IsString, IsOptional, IsEnum } from 'class-validator';
import { SupportStatus } from '@prisma/client';

export class CreateSupportMailboxDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  images?: any;

  @IsOptional()
  @IsEnum(SupportStatus)
  status?: SupportStatus;
}