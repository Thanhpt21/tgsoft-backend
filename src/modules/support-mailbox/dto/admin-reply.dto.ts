import { IsString, IsOptional, IsEnum } from 'class-validator';
import { SupportStatus } from '@prisma/client';

export class AdminReplyDto {
  @IsString()
  adminReply: string;

  @IsOptional()
  @IsEnum(SupportStatus)
  status?: SupportStatus;
}