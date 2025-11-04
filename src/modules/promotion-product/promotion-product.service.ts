import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreatePromotionProductDto } from './dto/create-promotion-product.dto';
import { UpdatePromotionProductDto } from './dto/update-promotion-product.dto';
import { PromotionProductResponseDto } from './dto/promotion-product-response.dto';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';

@Injectable()
export class PromotionProductService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
  ) {
    super(prisma, request);
  }

  async create(dto: CreatePromotionProductDto) {
    const promotionProduct = await this.prisma.promotionProduct.create({
      data: {
        promotionId: dto.promotionId,
        productId: dto.productId,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        giftProductId: dto.giftProductId || null,
        giftQuantity: dto.giftQuantity || 0,
        saleQuantity: dto.saleQuantity || 0,
      },
    });

    return {
      success: true,
      message: 'Tạo Promotion Product thành công',
      data: new PromotionProductResponseDto(promotionProduct),
    };
  }

  async getPromotionProducts(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [promotionProducts, total] = await this.prisma.$transaction([
      this.prisma.promotionProduct.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.promotionProduct.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách Promotion Product thành công',
      data: {
        data: promotionProducts.map((p) => new PromotionProductResponseDto(p)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number) {
  const promotionProduct = await this.prisma.promotionProduct.findUnique({
    where: { id },
    include: {
      promotion: true,
      product: true,
      giftProduct: true,
    },
  });

  if (!promotionProduct) {
    return {
      success: false,
      message: `Không tìm thấy Promotion Product với id: ${id}`,
    };
  }

  return {
    success: true,
    message: 'Lấy chi tiết Promotion Product thành công',
    data: {
      id: promotionProduct.id,
      promotionId: promotionProduct.promotionId,
      productId: promotionProduct.productId,
      giftProductId: promotionProduct.giftProductId,
      discountType: promotionProduct.discountType,
      discountValue: promotionProduct.discountValue,
      saleQuantity: promotionProduct.saleQuantity,
      giftQuantity: promotionProduct.giftQuantity,
      createdAt: promotionProduct.createdAt,
      updatedAt: promotionProduct.updatedAt,

      // Thông tin chi tiết từ các bảng liên kết
      promotion: promotionProduct.promotion,
      product: promotionProduct.product,
      giftProduct: promotionProduct.giftProduct,
    },
  };
}

  async update(id: number, dto: UpdatePromotionProductDto) {
    const promotionProduct = await this.prisma.promotionProduct.findUnique({ where: { id } });
    if (!promotionProduct) {
      return { success: false, message: 'Promotion Product không tồn tại' };
    }

    const updated = await this.prisma.promotionProduct.update({
      where: { id },
      data: {
        ...dto,
      },
    });

    return {
      success: true,
      message: 'Cập nhật Promotion Product thành công',
      data: new PromotionProductResponseDto(updated),
    };
  }

  async delete(id: number) {
    const promotionProduct = await this.prisma.promotionProduct.findUnique({ where: { id } });
    if (!promotionProduct) {
      return { success: false, message: 'Promotion Product không tồn tại' };
    }

    await this.prisma.promotionProduct.delete({ where: { id } });

    return { success: true, message: 'Xóa Promotion Product thành công' };
  }

  async getProductsByPromotionId(promotionId: number) {
    const promotionProducts = await this.prisma.promotionProduct.findMany({
      where: { promotionId },
      orderBy: { createdAt: 'desc' },
      include: {
        promotion: true,
        product: true, // Kết nối với bảng 'product' để lấy thông tin chi tiết sản phẩm
        giftProduct: true
      },
    });

    if (!promotionProducts || promotionProducts.length === 0) {
      return {
        success: false,
        message: `Không có sản phẩm khuyến mãi nào cho chương trình với promotionId: ${promotionId}`,
      };
    }

    return {
      success: true,
      message: 'Lấy danh sách sản phẩm khuyến mãi thành công',
      data: promotionProducts.map((p) => ({
        id: p.id,
        promotionId: p.promotionId,
        productId: p.productId,
        promotion: p.promotion, // Thông tin chi tiết chương trình khuyến mãi
        product: p.product, // Thông tin chi tiết sản phẩm
        giftProduct: p.giftProduct,
        discountType: p.discountType,
        discountValue: p.discountValue,
        giftProductId: p.giftProductId,
        giftQuantity: p.giftQuantity,
        saleQuantity: p.saleQuantity,
      })),
    };
  }
}
