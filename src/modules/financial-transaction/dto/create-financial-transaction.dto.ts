import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { TransactionType, ReceiverType } from '@prisma/client';

export class CreateFinancialTransactionDto {


  @IsOptional()
  @IsInt()
  orderId?: number;

  @IsInt()
  payoutId?: number;

  @IsOptional()
  @IsInt()
  commissionId?: number;

  @IsEnum(ReceiverType)
  receiverType: ReceiverType;

  @IsOptional()
  @IsInt()
  userId?: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsInt()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
