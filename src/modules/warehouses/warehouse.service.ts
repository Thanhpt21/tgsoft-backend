// src/modules/warehouses/warehouse.service.ts
import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { WarehouseResponseDto } from './dto/warehouse-response.dto';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { Prisma } from '@prisma/client';

@Injectable()
export class WarehouseService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
  ) {
    super(prisma, request);
  }

  async create(dto: CreateWarehouseDto) {
    const existing = await this.prisma.warehouse.findFirst({
      where: { name: dto.name, tenantId: this.tenantId },
    });
    if (existing) return { success: false, message: 'Warehouse đã tồn tại trong tenant' };

    const warehouse = await this.prisma.warehouse.create({
      data: {
        name: dto.name,
        location: dto.location ?? Prisma.DbNull,
        code: dto.code || null,
        tenantId: this.tenantId,
      },
    });

    return { success: true, message: 'Tạo warehouse thành công', data: new WarehouseResponseDto(warehouse) };
  }

  async getWarehouses(
    page = 1,
    limit = 10,
    search = ''
  ) {
    const skip = (page - 1) * limit;

    const where: any = { tenantId: this.tenantId };

    // Nếu có search theo tên hoặc code
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [warehouses, total] = await this.prisma.$transaction([
      this.prisma.warehouse.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.warehouse.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách warehouse thành công',
      data: {
        data: warehouses.map((w) => new WarehouseResponseDto(w)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }


  async getAllWarehouses(search?: string) {
    const where: any = { tenantId: this.tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const warehouses = await this.prisma.warehouse.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      message: 'Lấy tất cả warehouse thành công',
      data: warehouses.map(w => new WarehouseResponseDto(w)),
    };
  }

  async getWarehouseById(id: number) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, tenantId: this.tenantId },
    });

    if (!warehouse) return { success: false, message: 'Warehouse không tồn tại trong tenant' };

    return { success: true, message: 'Lấy warehouse thành công', data: new WarehouseResponseDto(warehouse) };
  }

  async updateWarehouse(id: number, dto: UpdateWarehouseDto) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, tenantId: this.tenantId },
    });

    if (!warehouse) return { success: false, message: 'Warehouse không tồn tại trong tenant' };

    const updated = await this.prisma.warehouse.update({
      where: { id },
      data: { ...dto },
    });

    return { success: true, message: 'Cập nhật warehouse thành công', data: new WarehouseResponseDto(updated) };
  }

  async deleteWarehouse(id: number) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, tenantId: this.tenantId },
    });

    if (!warehouse) return { success: false, message: 'Warehouse không tồn tại trong tenant' };

    await this.prisma.warehouse.delete({ where: { id } });

    return { success: true, message: 'Xóa warehouse thành công' };
  }
}
