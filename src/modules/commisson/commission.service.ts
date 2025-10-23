// src/modules/commission/commission.service.ts
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { Prisma } from '@prisma/client';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { CommissionResponseDto } from './dto/commission-response.dto';

@Injectable()
export class CommissionService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
  ) {
    super(prisma, request);
  }
  

  async create(dto: CreateCommissionDto) {
    const order = await this.prisma.order.findFirst({
      where: { 
        id: dto.orderId,
        tenantId: this.tenantId,
      },
    });

    if (!order) {
      throw new BadRequestException(`Order ID ${dto.orderId} không tồn tại trong tenant`);
    }

    const commission = await this.prisma.commission.create({
      data: {
        tenantId: this.tenantId,
        orderId: dto.orderId,
        amount: dto.amount,
        rate: dto.rate,
      },
    });

    return {
      success: true,
      message: 'Tạo hoa hồng thành công',
      data: new CommissionResponseDto(commission),
    };
  }

  async getCommissions(
    page = 1,
    limit = 10,
    orderId?: number,
    search = '',
  ) {
    const skip = (page - 1) * limit;
    const where: any = {
      tenantId: this.tenantId,
    };

    if (orderId) where.orderId = orderId;
    if (search) {
      where.OR = [
        { orderId: { contains: search, mode: 'insensitive' } },
        { id: Number.isNaN(+search) ? undefined : +search },
      ].filter(Boolean);
    }

    const [commissions, total] = await this.prisma.$transaction([
      this.prisma.commission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commission.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách hoa hồng thành công',
      data: {
        data: commissions.map((c) => new CommissionResponseDto(c)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async getCommissionById(id: number) {
    const commission = await this.prisma.commission.findFirst({
      where: { id, tenantId: this.tenantId },
    });

    if (!commission) {
      throw new BadRequestException('Hoa hồng không tồn tại trong tenant');
    }

    return {
      success: true,
      message: 'Lấy thông tin hoa hồng thành công',
      data: new CommissionResponseDto(commission),
    };
  }

  async updateCommission(id: number, dto: UpdateCommissionDto) {
    const existing = await this.prisma.commission.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
      },
    });

    if (!existing) {
      throw new BadRequestException('Hoa hồng không tồn tại trong tenant');
    }

    const updated = await this.prisma.commission.update({
      where: { id, tenantId: this.tenantId },
      data: dto,
    });

    return {
      success: true,
      message: 'Cập nhật hoa hồng thành công',
      data: new CommissionResponseDto(updated),
    };
  }

  async deleteCommission(id: number) {
    const existing = await this.prisma.commission.findFirst({
      where: { id, tenantId: this.tenantId },
    });

    if (!existing) {
      throw new BadRequestException('Hoa hồng không tồn tại trong tenant');
    }

    await this.prisma.commission.delete({ where: { id } });

    return {
      success: true,
      message: 'Xóa hoa hồng thành công',
    };
  }
}
