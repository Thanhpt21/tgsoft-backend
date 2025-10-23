import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { AttributeResponseDto } from './dto/attribute-response.dto';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

@Injectable()
export class AttributesService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
  ) {
    super(prisma, request);
  }

  async create(dto: CreateAttributeDto) {
    const existing = await this.prisma.attribute.findFirst({
      where: { name: dto.name, tenantId: this.tenantId },
    });
    if (existing)
      return { success: false, message: 'Attribute đã tồn tại trong tenant' };

    const attribute = await this.prisma.attribute.create({
      data: {
        name: dto.name,
        position: dto.position ?? 1,
        type: dto.type,
        tenant: { connect: { id: this.tenantId } },
      },
    });

    return {
      success: true,
      message: 'Tạo attribute thành công',
      data: new AttributeResponseDto(attribute),
    };
  }

  async getAttributes(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;

    const where: any = { tenantId: this.tenantId };
    if (search) {
      where.OR = [{ name: { contains: search, mode: 'insensitive' } }];
    }

    const [attributes, total] = await this.prisma.$transaction([
      this.prisma.attribute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.attribute.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách attribute thành công',
      data: {
        data: attributes.map((a) => new AttributeResponseDto(a)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async getAllAttributes(search = '') {
    const where: any = { tenantId: this.tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        // nếu cần search thêm field khác, thêm vào đây
      ];
    }

    const attributes = await this.prisma.attribute.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      message: 'Lấy tất cả attribute thành công',
      data: attributes.map((a) => new AttributeResponseDto(a)),
    };
  }

  async getAttributeById(id: number) {
    const attribute = await this.prisma.attribute.findFirst({
      where: { id, tenantId: this.tenantId },
    });
    if (!attribute)
      return { success: false, message: 'Attribute không tồn tại trong tenant' };

    return {
      success: true,
      message: 'Lấy attribute thành công',
      data: new AttributeResponseDto(attribute),
    };
  }

  async updateAttribute(id: number, dto: UpdateAttributeDto) {
    const attribute = await this.prisma.attribute.findFirst({
      where: { id, tenantId: this.tenantId },
    });
    if (!attribute)
      return { success: false, message: 'Attribute không tồn tại trong tenant' };

    const updated = await this.prisma.attribute.update({
      where: { id },
      data: { ...dto },
    });

    return {
      success: true,
      message: 'Cập nhật attribute thành công',
      data: new AttributeResponseDto(updated),
    };
  }

  async deleteAttribute(id: number) {
    const attribute = await this.prisma.attribute.findFirst({
      where: { id, tenantId: this.tenantId },
    });
    if (!attribute)
      return { success: false, message: 'Attribute không tồn tại trong tenant' };

    await this.prisma.attribute.delete({ where: { id } });

    return {
      success: true,
      message: 'Xóa attribute thành công',
    };
  }
}

