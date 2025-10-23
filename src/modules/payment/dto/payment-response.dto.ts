// dto/payment-response.dto.ts
import { Payment, PaymentMethod, Refund } from '@prisma/client';

export class PaymentResponseDto {
  id: number;
  orderId: number;
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: string;
  transactionId?: string | null;
  providerData?: any;
  refunds?: Refund[];
  createdAt: Date;
  updatedAt: Date;

  constructor(payment: Payment & { method: PaymentMethod; refunds?: Refund[] }) {
    this.id = payment.id;
    this.orderId = payment.orderId;
    this.method = payment.method;
    this.amount = payment.amount;
    this.currency = payment.currency;
    this.status = payment.status;
    this.transactionId = payment.transactionId;
    this.providerData = payment.providerData;
    this.refunds = payment.refunds ?? [];
    this.createdAt = payment.createdAt;
    this.updatedAt = payment.updatedAt;
  }
}