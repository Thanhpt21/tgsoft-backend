import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { ProductAttributeResponseDto } from './dto/product-attribute-response.dto';

@Injectable()
export class ProductAttributesService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
  ) {
    super(prisma, request);
  }

  async assign(productId: number, attributeId: number) {
    const existing = await this.prisma.productAttribute.findUnique({
      where: { productId_attributeId: { productId, attributeId } },
    });
    if (existing)
      return { success: false, message: 'Attribute đã được gán cho product' };

    const pa = await this.prisma.productAttribute.create({
      data: { productId, attributeId },
    });

    return {
      success: true,
      message: 'Gán Attribute cho Product thành công',
      data: new ProductAttributeResponseDto(pa),
    };
  }

  async getByProduct(productId: number) {
    const list = await this.prisma.productAttribute.findMany({
      where: { productId },
    });

    return {
      success: true,
      message: 'Lấy danh sách Attribute của product thành công',
      data: list.map((pa) => new ProductAttributeResponseDto(pa)),
    };
  }

  async remove(productId: number, attributeId: number) {
    const existing = await this.prisma.productAttribute.findUnique({
      where: { productId_attributeId: { productId, attributeId } },
    });
    if (!existing)
      return { success: false, message: 'Attribute không tồn tại trên product' };

    await this.prisma.productAttribute.delete({
      where: { productId_attributeId: { productId, attributeId } },
    });

    return { success: true, message: 'Xóa Attribute khỏi product thành công' };
  }
}
