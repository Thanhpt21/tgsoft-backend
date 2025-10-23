import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { CreateVariantAttributeValueDto } from './dto/create-variant-attribute-value.dto';
import { UpdateVariantAttributeValueDto } from './dto/update-variant-attribute-value.dto';
import { VariantAttributeValueResponseDto } from './dto/variant-attribute-value-response.dto';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

@Injectable()
export class VariantAttributeValuesService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
  ) {
    super(prisma, request);
  }

  async create(dto: CreateVariantAttributeValueDto) {
    const existing = await this.prisma.variantAttributeValue.findUnique({
      where: { variantId_attributeValueId: { variantId: dto.variantId, attributeValueId: dto.attributeValueId } },
    });
    if (existing)
      return { success: false, message: 'Giá trị thuộc tính này đã tồn tại trong variant' };

    const variant = await this.prisma.productVariant.findUnique({ where: { id: dto.variantId } });
    if (!variant)
      return { success: false, message: 'Variant không tồn tại' };

    const attrValue = await this.prisma.attributeValue.findUnique({ where: { id: dto.attributeValueId } });
    if (!attrValue)
      return { success: false, message: 'AttributeValue không tồn tại' };

    const record = await this.prisma.variantAttributeValue.create({ data: dto });
    return {
      success: true,
      message: 'Thêm thuộc tính cho variant thành công',
      data: new VariantAttributeValueResponseDto(record),
    };
  }

async findAll(productId: number) {
  const variants = await this.prisma.productVariant.findMany({
    where: { productId },
    include: {
      attributeValues: {
        include: {
          attributeValue: {
            include: {
              attribute: true, // Lấy luôn thuộc tính cha
            },
          },
        },
      },
    },
    orderBy: { id: 'desc' },
  });

  const formatted = variants.map((variant) => {
    const attributeValues = variant.attributeValues.map((vav) => ({
      id: vav.attributeValue.id,
      value: vav.attributeValue.value,
      attribute: {
        id: vav.attributeValue.attribute.id,
        name: vav.attributeValue.attribute.name,
        type: vav.attributeValue.attribute.type,
      },
    }));

    return {
      ...variant,
      attributeValues,
    };
  });

  return {
    success: true,
    message: 'Lấy danh sách ProductVariant thành công',
    data: formatted,
  };
}

  async findOne(variantId: number, attributeValueId: number) {
    const record = await this.prisma.variantAttributeValue.findUnique({
      where: { variantId_attributeValueId: { variantId, attributeValueId } },
      include: { attributeValue: true, variant: true },
    });

    if (!record)
      return { success: false, message: 'Không tìm thấy VariantAttributeValue' };

    return {
      success: true,
      message: 'Lấy VariantAttributeValue thành công',
      data: new VariantAttributeValueResponseDto(record),
    };
  }

  async delete(variantId: number, attributeValueId: number) {
    const record = await this.prisma.variantAttributeValue.findUnique({
      where: { variantId_attributeValueId: { variantId, attributeValueId } },
    });
    if (!record)
      return { success: false, message: 'Không tìm thấy VariantAttributeValue' };

    await this.prisma.variantAttributeValue.delete({
      where: { variantId_attributeValueId: { variantId, attributeValueId } },
    });

    return { success: true, message: 'Xóa VariantAttributeValue thành công' };
  }

    async update(
    variantId: number,
    attributeValueId: number,
    dto: UpdateVariantAttributeValueDto,
  ) {
    const existing = await this.prisma.variantAttributeValue.findUnique({
      where: { variantId_attributeValueId: { variantId, attributeValueId } },
    });

    if (!existing)
      return { success: false, message: 'Không tìm thấy VariantAttributeValue' };

    const newVariantId = dto.variantId ?? variantId;
    const newAttributeValueId = dto.attributeValueId ?? attributeValueId;

    // Nếu không có thay đổi thì return
    if (newVariantId === variantId && newAttributeValueId === attributeValueId)
      return { success: true, message: 'Không có thay đổi cần cập nhật' };

    // Kiểm tra trùng composite key
    const conflict = await this.prisma.variantAttributeValue.findUnique({
      where: {
        variantId_attributeValueId: {
          variantId: newVariantId,
          attributeValueId: newAttributeValueId,
        },
      },
    });
    if (conflict)
      return { success: false, message: 'Cặp variant - attributeValue mới đã tồn tại' };

    // Kiểm tra variant và attributeValue mới
    const variant = await this.prisma.productVariant.findUnique({ where: { id: newVariantId } });
    if (!variant)
      return { success: false, message: 'Variant mới không tồn tại' };

    const attrValue = await this.prisma.attributeValue.findUnique({ where: { id: newAttributeValueId } });
    if (!attrValue)
      return { success: false, message: 'AttributeValue mới không tồn tại' };

    // Transaction để đảm bảo an toàn dữ liệu
    const [_, created] = await this.prisma.$transaction([
      this.prisma.variantAttributeValue.delete({
        where: { variantId_attributeValueId: { variantId, attributeValueId } },
      }),
      this.prisma.variantAttributeValue.create({
        data: {
          variantId: newVariantId,
          attributeValueId: newAttributeValueId,
          createdAt: existing.createdAt, // Giữ createdAt cũ
        },
      }),
    ]);

    return {
      success: true,
      message: 'Cập nhật VariantAttributeValue thành công',
      data: new VariantAttributeValueResponseDto(created),
    };
  }
}
