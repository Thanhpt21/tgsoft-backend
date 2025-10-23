// payment-methods.service.ts
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodResponseDto } from './dto/payment-method-response.dto';

@Injectable()
export class PaymentMethodsService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
  ) {
    super(prisma, request);
  }

  async create(dto: CreatePaymentMethodDto) {
    // Kiểm tra code đã tồn tại chưa trong tenant này
    const existing = await this.prisma.paymentMethod.findFirst({
      where: { 
        code: dto.code,
        tenantId: this.tenantId,
      },
    });

    if (existing) {
      throw new BadRequestException(`Payment method với code "${dto.code}" đã tồn tại`);
    }

    const paymentMethod = await this.prisma.paymentMethod.create({
      data: {
        code: dto.code,
        name: dto.name,
        tenant: { connect: { id: this.tenantId } },
      },
    });

    return {
      success: true,
      message: 'Tạo payment method thành công',
      data: new PaymentMethodResponseDto(paymentMethod),
    };
  }

  async getPaymentMethods(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;

    const where: any = { tenantId: this.tenantId };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [paymentMethods, total] = await this.prisma.$transaction([
      this.prisma.paymentMethod.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.paymentMethod.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách payment method thành công',
      data: {
        data: paymentMethods.map((pm) => new PaymentMethodResponseDto(pm)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async getPaymentMethodById(id: number) {
    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { 
        id,
        tenantId: this.tenantId,
      },
    });

    if (!paymentMethod) {
      throw new BadRequestException('Payment method không tồn tại trong tenant');
    }

    return {
      success: true,
      message: 'Lấy payment method thành công',
      data: new PaymentMethodResponseDto(paymentMethod),
    };
  }

  async updatePaymentMethod(id: number, dto: UpdatePaymentMethodDto) {
    const existing = await this.prisma.paymentMethod.findFirst({ 
      where: { 
        id,
        tenantId: this.tenantId,
      },
    });
    
    if (!existing) {
      throw new BadRequestException('Payment method không tồn tại trong tenant');
    }

    // Nếu update code, kiểm tra code mới có trùng không (trong cùng tenant)
    if (dto.code && dto.code !== existing.code) {
      const duplicateCode = await this.prisma.paymentMethod.findFirst({
        where: { 
          code: dto.code,
          tenantId: this.tenantId,
          id: { not: id },
        },
      });

      if (duplicateCode) {
        throw new BadRequestException(`Payment method với code "${dto.code}" đã tồn tại`);
      }
    }

    const updated = await this.prisma.paymentMethod.update({
      where: { id },
      data: dto,
    });

    return {
      success: true,
      message: 'Cập nhật payment method thành công',
      data: new PaymentMethodResponseDto(updated),
    };
  }

async deletePaymentMethod(id: number) {
    const existing = await this.prisma.paymentMethod.findFirst({ 
      where: { 
        id,
        tenantId: this.tenantId,
      },
    });
    
    if (!existing) {
      throw new BadRequestException('Payment method không tồn tại trong tenant');
    }

    // Kiểm tra xem có payment nào đang sử dụng payment method này không
    const paymentsUsingMethod = await this.prisma.payment.count({
      where: { 
        methodId: id, // Sử dụng methodId thay vì method
        order: {
          tenantId: this.tenantId,
        },
      },
    });

    if (paymentsUsingMethod > 0) {
      throw new BadRequestException(
        `Không thể xóa payment method này vì đang có ${paymentsUsingMethod} payment đang sử dụng`,
      );
    }

    await this.prisma.paymentMethod.delete({ where: { id } });

    return { success: true, message: 'Xóa payment method thành công' };
  }
  // Lấy tất cả payment methods (không phân trang) - dùng cho dropdown
  async getAllPaymentMethods() {
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: { tenantId: this.tenantId },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      message: 'Lấy tất cả payment method thành công',
      data: paymentMethods.map((pm) => new PaymentMethodResponseDto(pm)),
    };
  }
}