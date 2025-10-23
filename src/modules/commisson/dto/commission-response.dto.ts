// src/modules/commission/dto/commission-response.dto.ts
import { Commission } from '@prisma/client';

export class CommissionResponseDto {
  id: number;
  tenantId: number;
  orderId: number;
  amount: number;
  rate: number;
  createdAt: Date;

  constructor(commission: Commission) {
    this.id = commission.id;
    this.tenantId = commission.tenantId;
    this.orderId = commission.orderId;
    this.amount = commission.amount;
    this.rate = commission.rate;
    this.createdAt = commission.createdAt;
  }
}
