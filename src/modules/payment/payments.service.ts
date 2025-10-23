// payments.service.ts
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { Prisma, PaymentStatus } from '@prisma/client';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { convertVnpDate } from 'src/utils/date.util';


@Injectable()
export class PaymentsService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
  ) {
    super(prisma, request);
  }

  async create(dto: CreatePaymentDto) {
    // Kiểm tra order tồn tại và thuộc tenant
    const order = await this.prisma.order.findFirst({
      where: { 
        id: dto.orderId,
        tenantId: this.tenantId,
      },
    });

    if (!order) {
      throw new BadRequestException(`Order ID ${dto.orderId} không tồn tại trong tenant`);
    }

    // Kiểm tra payment method tồn tại và thuộc tenant
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { 
        id: dto.methodId,
        tenantId: this.tenantId,
      },
    });

    if (!paymentMethod) {
      throw new BadRequestException(`Payment method ID ${dto.methodId} không tồn tại trong tenant`);
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        methodId: dto.methodId,
        tenantId: this.tenantId,
        amount: dto.amount,
        currency: dto.currency ?? 'VND',
        status: dto.status ?? PaymentStatus.PENDING,
        transactionId: dto.transactionId,
        providerData: dto.providerData
          ? (dto.providerData as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
      include: {
        method: true,
        refunds: true,
      },
    });

    return {
      success: true,
      message: 'Tạo payment thành công',
      data: new PaymentResponseDto(payment),
    };
  }

  async getPayments(
    page = 1,
    limit = 10,
    orderId?: number,
    status?: string,
    methodId?: number,
    search = '',
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: this.tenantId,
    };

    if (orderId) where.orderId = orderId;
    if (status) where.status = status as PaymentStatus;
    if (methodId) where.methodId = methodId;
    if (search) {
      where.OR = [
        { transactionId: { contains: search, mode: 'insensitive' } },
        { id: Number.isNaN(+search) ? undefined : +search },
      ].filter(Boolean);
    }

    const [payments, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          method: true,
          order: {
            select: {
              id: true,
              userId: true,
              totalAmount: true,
              status: true,
            },
          },
          refunds: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách payment thành công',
      data: {
        data: payments.map((p) => new PaymentResponseDto(p)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async getPaymentById(id: number) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
      },
      include: {
        method: true,
        order: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        refunds: true,
      },
    });

    if (!payment) {
      throw new BadRequestException('Payment không tồn tại trong tenant');
    }

    return {
      success: true,
      message: 'Lấy payment thành công',
      data: new PaymentResponseDto(payment),
    };
  }

  async updatePayment(id: number, dto: UpdatePaymentDto) {
    const existing = await this.prisma.payment.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
      },
    });

    if (!existing) {
      throw new BadRequestException('Payment không tồn tại trong tenant');
    }

    const updated = await this.prisma.payment.update({
      where: { id, tenantId: this.tenantId },
      data: {
        ...dto,
        providerData: dto.providerData
          ? (dto.providerData as unknown as Prisma.InputJsonValue)
          : undefined,
      },
      include: {
        method: true,
        refunds: true,
      },
    });

    return {
      success: true,
      message: 'Cập nhật payment thành công',
      data: new PaymentResponseDto(updated),
    };
  }

  async deletePayment(id: number) {
    const existing = await this.prisma.payment.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
      },
      include: {
        refunds: true,
      },
    });

    if (!existing) {
      throw new BadRequestException('Payment không tồn tại trong tenant');
    }

    // Kiểm tra xem có refund nào không
    if (existing.refunds && existing.refunds.length > 0) {
      throw new BadRequestException(
        `Không thể xóa payment này vì đang có ${existing.refunds.length} refund liên quan`,
      );
    }

    // Chỉ cho phép xóa nếu status là PENDING hoặc FAILED
    if (existing.status !== PaymentStatus.PENDING && existing.status !== PaymentStatus.FAILED) {
      throw new BadRequestException(
        `Không thể xóa payment có status là ${existing.status}. Chỉ có thể xóa payment PENDING hoặc FAILED`,
      );
    }

    await this.prisma.payment.delete({ where: { id } });

    return { success: true, message: 'Xóa payment thành công' };
  }

  // Lấy payments theo orderId
  async getPaymentsByOrderId(orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId: this.tenantId,
      },
    });

    if (!order) {
      throw new BadRequestException('Order không tồn tại trong tenant');
    }

    const payments = await this.prisma.payment.findMany({
      where: { orderId },
      include: {
        method: true,
        refunds: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      message: 'Lấy payments của order thành công',
      data: payments.map((p) => new PaymentResponseDto(p)),
    };
  }

  // Thống kê payments
  async getPaymentStats() {
    const stats = await this.prisma.payment.groupBy({
      by: ['status'],
      where: {
        order: {
          tenantId: this.tenantId,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    });

    return {
      success: true,
      message: 'Lấy thống kê payment thành công',
      data: stats,
    };
  }

  async createOrUpdateFromVnpay(result: {
    orderId: string;
    amount: number;
    tenantId: number; 
    transactionNo: string;
    bankCode: string;
    payDate: string;
    isValid: boolean;
    responseCode: string;
  }) {
    const orderId = parseInt(result.orderId, 10);

    // ✅ 1. Lấy methodId tương ứng với code "VNPAY"
    const method = await this.prisma.paymentMethod.findFirst({
      where: {
        code: 'VNPAY',
        tenantId: result.tenantId,
      },
    });

    if (!method) {
      throw new Error('Payment method "VNPAY" chưa được cấu hình trong hệ thống');
    }

    // ✅ 2. Cập nhật trạng thái đơn hàng
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paymentStatus: 'SUCCESS',
      },
    });

    // ✅ 3. Kiểm tra xem payment đã tồn tại chưa
    const existing = await this.prisma.payment.findFirst({
      where: { transactionId: result.transactionNo },
    });

    const payDate = convertVnpDate(result.payDate);

    if (existing) {
      await this.prisma.payment.update({
        where: { id: existing.id },
        data: {
          amount: result.amount,
          status: 'SUCCESS',
          providerData: {
            transactionNo: result.transactionNo,
            bankCode: result.bankCode,
            payDate: payDate.toISOString(),
          },
        },
      });
    } else {
      await this.prisma.payment.create({
        data: {
          orderId: orderId,
          tenantId: result.tenantId,
          amount: result.amount,
          status: 'SUCCESS',
          transactionId: result.transactionNo,
          currency: 'VND',
          providerData: {
            bankCode: result.bankCode,
            payDate: payDate.toISOString(),
          },
          methodId: method.id, // 👈 dùng đúng ID của phương thức VNPAY
        },
      });
    }
  }


}