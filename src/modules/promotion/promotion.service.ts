import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';

import { PromotionResponseDto } from './dto/promotion-response.dto';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { UpdatePromotionDto } from './dto/update-promption.dto';

@Injectable()
export class PromotionService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
  ) {
    super(prisma, request);
  }

  async create(dto: CreatePromotionDto) {
    const promotion = await this.prisma.promotion.create({
      data: {
        tenantId: this.tenantId,
        name: dto.name,
        description: dto.description,
        isFlashSale: dto.isFlashSale,
        startTime: dto.startTime,
        endTime: dto.endTime,
        repeatCount: dto.repeatCount,
        status: dto.status,
      },
    });

    return {
      success: true,
      message: 'Tạo promotion thành công',
      data: new PromotionResponseDto(promotion),
    };
  }

  async getPromotions(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;
    const where: any = { tenantId: this.tenantId };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [promotions, total] = await this.prisma.$transaction([
      this.prisma.promotion.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.promotion.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách promotion thành công',
      data: {
        data: promotions.map((p) => new PromotionResponseDto(p)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async getAll(search: string = '') {
    const where: any = { tenantId: this.tenantId };
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const promotions = await this.prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      message: 'Lấy danh sách promotion thành công',
      data: promotions.map((p) => new PromotionResponseDto(p)),
    };
  }

  async getById(id: number) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
    });

    if (!promotion || promotion.tenantId !== this.tenantId)
      return { success: false, message: 'Promotion không tồn tại' };

    return {
      success: true,
      message: 'Lấy promotion thành công',
      data: new PromotionResponseDto(promotion),
    };
  }

  async update(id: number, dto: UpdatePromotionDto) {
    const promotion = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promotion || promotion.tenantId !== this.tenantId)
      return { success: false, message: 'Promotion không tồn tại' };

    const updated = await this.prisma.promotion.update({
      where: { id },
      data: {
        ...dto,
      },
    });

    return {
      success: true,
      message: 'Cập nhật promotion thành công',
      data: new PromotionResponseDto(updated),
    };
  }

  async delete(id: number) {
    const promotion = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promotion || promotion.tenantId !== this.tenantId)
      return { success: false, message: 'Promotion không tồn tại' };

    await this.prisma.promotion.delete({ where: { id } });

    return { success: true, message: 'Xóa promotion thành công' };
  }
}
