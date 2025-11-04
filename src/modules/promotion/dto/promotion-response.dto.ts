import { PromotionStatus } from '@prisma/client';

export class PromotionResponseDto {
  id: number;
  tenantId: number;
  name: string;
  description: string | null;
  isFlashSale: boolean | null;
  startTime: Date;
  endTime: Date;
  repeatCount: number | null;
  status: PromotionStatus | null;
  createdAt: Date | null;
  updatedAt: Date | null;

  constructor(partial: Partial<PromotionResponseDto>) {
    Object.assign(this, partial);
  }
}
