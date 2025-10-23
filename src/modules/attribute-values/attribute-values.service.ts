import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';
import { AttributeValueResponseDto } from './dto/attribute-value-response.dto';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

@Injectable()
export class AttributeValuesService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
  ) {
    super(prisma, request);
  }

  async create(dto: CreateAttributeValueDto) {
    const existing = await this.prisma.attributeValue.findFirst({
      where: { attributeId: dto.attributeId, value: dto.value },
    });
    if (existing)
      return { success: false, message: 'Value này đã tồn tại cho attribute này' };

    const attributeValue = await this.prisma.attributeValue.create({
      data: dto,
    });

    return {
      success: true,
      message: 'Tạo AttributeValue thành công',
      data: new AttributeValueResponseDto(attributeValue),
    };
  }

  async getAll(attributeId?: number) {
    const where: any = {};
    if (attributeId) where.attributeId = attributeId;

    const values = await this.prisma.attributeValue.findMany({ where });

    return {
      success: true,
      message: 'Lấy danh sách AttributeValue thành công',
      data: values.map((v) => new AttributeValueResponseDto(v)),
    };
  }

  async getById(id: number) {
    const value = await this.prisma.attributeValue.findUnique({ where: { id } });
    if (!value)
      return { success: false, message: 'AttributeValue không tồn tại' };

    return {
      success: true,
      message: 'Lấy AttributeValue thành công',
      data: new AttributeValueResponseDto(value),
    };
  }

  async update(id: number, dto: UpdateAttributeValueDto) {
    const value = await this.prisma.attributeValue.findUnique({ where: { id } });
    if (!value)
      return { success: false, message: 'AttributeValue không tồn tại' };

    const updated = await this.prisma.attributeValue.update({
      where: { id },
      data: dto,
    });

    return {
      success: true,
      message: 'Cập nhật AttributeValue thành công',
      data: new AttributeValueResponseDto(updated),
    };
  }

  async delete(id: number) {
    const value = await this.prisma.attributeValue.findUnique({ where: { id } });
    if (!value)
      return { success: false, message: 'AttributeValue không tồn tại' };

    await this.prisma.attributeValue.delete({ where: { id } });

    return { success: true, message: 'Xóa AttributeValue thành công' };
  }
}
