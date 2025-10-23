import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { UploadService } from '../upload/upload.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { ConfigResponseDto } from './dto/config-response.dto';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConfigService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
    private readonly uploadService: UploadService,
  ) {
    super(prisma, request);
  }

  async create(dto: CreateConfigDto, file?: Express.Multer.File) {
    let logoUrl: string | null = null;
    if (file) {
      logoUrl = await this.uploadService.uploadLocalImage(file);
    }

    const config = await this.prisma.config.create({
      data: { ...dto, logo: logoUrl, tenantId: this.tenantId },
    });

    return {
      success: true,
      message: 'Tạo config thành công',
      data: new ConfigResponseDto(config),
    };
  }

  async getConfigs(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;

    const where: Prisma.ConfigWhereInput = { tenantId: this.tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [configs, total] = await this.prisma.$transaction([
      this.prisma.config.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.config.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách config thành công',
      data: {
        data: configs.map((c) => new ConfigResponseDto(c)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }


  async getAll(search = '') {
    const where: Prisma.ConfigWhereInput = { tenantId: this.tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const configs = await this.prisma.config.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      message: 'Lấy danh sách config thành công',
      data: configs.map((c) => new ConfigResponseDto(c)),
    };
  }

  async getById(id: number) {
    const config = await this.prisma.config.findUnique({ where: { id } });
    if (!config) return { success: false, message: 'Config không tồn tại' };

    return {
      success: true,
      message: 'Lấy config thành công',
      data: new ConfigResponseDto(config),
    };
  }

  async update(id: number, dto: UpdateConfigDto, file?: Express.Multer.File) {
    const config = await this.prisma.config.findUnique({ where: { id } });
    if (!config) return { success: false, message: 'Config không tồn tại' };

    let logoUrl = config.logo;
    if (file) {
      if (config.logo) {
        await this.uploadService.deleteLocalImage(config.logo);
      }
      logoUrl = await this.uploadService.uploadLocalImage(file);
    }

    const updated = await this.prisma.config.update({
      where: { id },
      data: { ...dto, logo: logoUrl },
    });

    return {
      success: true,
      message: 'Cập nhật config thành công',
      data: new ConfigResponseDto(updated),
    };
  }

  async delete(id: number) {
    const config = await this.prisma.config.findUnique({ where: { id } });
    if (!config) return { success: false, message: 'Config không tồn tại' };

    if (config.logo) {
      await this.uploadService.deleteLocalImage(config.logo);
    }

    await this.prisma.config.delete({ where: { id } });

    return { success: true, message: 'Xóa config thành công' };
  }
}
