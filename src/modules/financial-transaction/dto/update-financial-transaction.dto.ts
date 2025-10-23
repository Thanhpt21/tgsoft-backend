import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { TransactionType, ReceiverType } from '@prisma/client';

export class UpdateFinancialTransactionDto {
  @IsOptional()
  @IsEnum(ReceiverType)
  receiverType?: ReceiverType;

  @IsOptional()
  @IsInt()
  amount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}
