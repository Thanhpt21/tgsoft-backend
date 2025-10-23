import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { Prisma, RefundStatus } from '@prisma/client';

import { CreateRefundDto } from './dto/create-refund.dto';
import { UpdateRefundDto } from './dto/update-refund.dto';
import { RefundResponseDto } from './dto/refund-response.dto';

@Injectable()
export class RefundsService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
  ) {
    super(prisma, request);
  }

  // Phương thức chung để lấy Refund và đảm bảo tính tenant-aware
  private async findRefundOrThrow(id: number) {
    const refund = await this.prisma.refund.findFirst({
      where: {
        id,
        // Đảm bảo Payment liên quan thuộc về tenant hiện tại
        payment: {
          tenantId: this.tenantId,
        },
      },
      include: {
        payment: true,
      },
    });

    if (!refund) {
      throw new NotFoundException('Refund không tồn tại hoặc không thuộc tenant của bạn');
    }
    return refund;
  }

  // 1. Tạo Refund
  async create(dto: CreateRefundDto) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: dto.paymentId,
        tenantId: this.tenantId,
      },
    });

    if (!payment) {
      throw new BadRequestException(`Payment ID ${dto.paymentId} không tồn tại trong tenant`);
    }
    
    // Logic nghiệp vụ: Ví dụ: Không thể tạo refund nếu payment đã bị HỦY hoặc FAILED
    if (payment.status !== 'SUCCESS') {
        throw new BadRequestException(`Không thể tạo refund cho payment có status là ${payment.status}.`);
    }
    
    // Có thể thêm kiểm tra tổng số tiền refund không vượt quá tổng số tiền payment
   const totalRefunded = await this.prisma.refund.aggregate({
        _sum: { amount: true },
        where: { paymentId: dto.paymentId, status: RefundStatus.SUCCESS },
    });
    
    // Sửa lỗi ở đây: Sử dụng toán tử nullish coalescing (??)
    const currentRefundedAmount = totalRefunded._sum.amount ?? 0;

    if (currentRefundedAmount + dto.amount > payment.amount) {
        throw new BadRequestException('Tổng số tiền refund vượt quá số tiền của payment.');
    }

    const refund = await this.prisma.refund.create({
      data: {
        paymentId: dto.paymentId,
        amount: dto.amount,
        reason: dto.reason,
        // Status mặc định là PENDING
      },
      include: {
        payment: true,
      },
    });

    return {
      success: true,
      message: 'Tạo refund thành công',
      data: new RefundResponseDto(refund),
    };
  }

  // 2. Lấy danh sách Refunds (Phân trang và Lọc)
  async getRefunds(
    page = 1,
    limit = 10,
    paymentId?: number,
    status?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.RefundWhereInput = {
      // Lọc theo tenant thông qua payment
      payment: {
        tenantId: this.tenantId,
      },
    };

    if (paymentId) where.paymentId = paymentId;
    if (status) where.status = status as RefundStatus;

    const [refunds, total] = await this.prisma.$transaction([
      this.prisma.refund.findMany({
        where,
        skip,
        take: limit,
        include: {
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.refund.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách refund thành công',
      data: {
        data: refunds.map((r) => new RefundResponseDto(r)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // 3. Lấy Refund theo ID
  async getRefundById(id: number) {
    const refund = await this.findRefundOrThrow(id);

    return {
      success: true,
      message: 'Lấy refund thành công',
      data: new RefundResponseDto(refund),
    };
  }

  // 4. Cập nhật Refund
  async updateRefund(id: number, dto: UpdateRefundDto) {
    // Kiểm tra và đảm bảo refund thuộc tenant
    const existing = await this.findRefundOrThrow(id);

    // Logic nghiệp vụ: Không cho phép cập nhật nếu refund đã COMPLETE
    if (existing.status === RefundStatus.SUCCESS) {
      throw new BadRequestException('Không thể cập nhật refund đã hoàn thành (COMPLETED)');
    }
    
    // Logic nghiệp vụ: Nếu cập nhật amount, cần kiểm tra lại giới hạn
    if (dto.amount !== undefined) {
        // ... (Cần code lại logic kiểm tra giới hạn amount ở đây)
    }

    // Cập nhật refund
    const updated = await this.prisma.refund.update({
      where: { id },
      data: {
        ...dto,
      },
      include: {
        payment: true,
      },
    });

    return {
      success: true,
      message: 'Cập nhật refund thành công',
      data: new RefundResponseDto(updated),
    };
  }

  // 5. Xóa Refund
  async deleteRefund(id: number) {
    const existing = await this.findRefundOrThrow(id);

    // Logic nghiệp vụ: Chỉ cho phép xóa nếu status là PENDING hoặc FAILED (chưa được xử lý)
    if (existing.status !== RefundStatus.PENDING && existing.status !== RefundStatus.FAILED) {
      throw new BadRequestException(
        `Không thể xóa refund có status là ${existing.status}. Chỉ có thể xóa refund PENDING hoặc FAILED.`,
      );
    }

    await this.prisma.refund.delete({ where: { id } });

    return { success: true, message: 'Xóa refund thành công' };
  }
}