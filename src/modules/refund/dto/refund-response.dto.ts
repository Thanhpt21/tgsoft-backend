import { Refund } from '@prisma/client';

export class RefundResponseDto {
  id: number;
  paymentId: number;
  amount: number;
  reason?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(refund: Refund) {
    this.id = refund.id;
    this.paymentId = refund.paymentId;
    this.amount = refund.amount;
    this.reason = refund.reason;
    this.status = refund.status;
    this.createdAt = refund.createdAt;
    this.updatedAt = refund.updatedAt;
  }
}
