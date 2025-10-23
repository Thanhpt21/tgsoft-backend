import { IsInt, IsString, IsOptional, IsEnum } from 'class-validator';
import { PayoutStatus, TransactionType, ReceiverType } from '@prisma/client';

export class FinancialTransactionResponseDto {
  @IsInt()
  id: number;

  @IsInt()
  tenantId: number;

  @IsOptional()
  @IsInt()
  orderId?: number;

  @IsOptional()
  @IsInt()
  payoutId?: number;

  @IsEnum(ReceiverType)
  receiverType: ReceiverType;

  @IsOptional()
  @IsInt()
  userId?: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsInt()
  amount: number;

  @IsString()
  currency: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  createdAt: string;

  constructor(financialTransaction: any) {
    this.id = financialTransaction.id;
    this.tenantId = financialTransaction.tenantId;
    this.orderId = financialTransaction.orderId ?? null;
    this.payoutId = financialTransaction.payoutId ?? null;
    this.receiverType = financialTransaction.receiverType;
    this.userId = financialTransaction.userId ?? null;
    this.type = financialTransaction.type;
    this.amount = financialTransaction.amount;
    this.currency = financialTransaction.currency;
    this.reference = financialTransaction.reference ?? null;
    this.description = financialTransaction.description ?? null;
    this.createdAt = financialTransaction.createdAt;
  }
}
