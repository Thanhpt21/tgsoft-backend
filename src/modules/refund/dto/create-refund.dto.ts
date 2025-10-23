import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateRefundDto {
  @IsInt()
  paymentId: number;

  @IsInt()
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
