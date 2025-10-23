import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { UploadService } from '../upload/upload.service'; // Import UploadService
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { ProductVariantResponseDto } from './dto/product-variant-response.dto';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

@Injectable()
export class ProductVariantService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
    private readonly uploadService: UploadService, // Inject UploadService
  ) {
    super(prisma, request);
  }

  async create(
    productId: number,
    dto: CreateProductVariantDto,
    thumb?: Express.Multer.File, // Nhận file
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId: this.tenantId },
    });
    if (!product)
      return { success: false, message: 'Product không tồn tại', data: null };

    let thumbUrl: string | null = null;
    if (thumb) {
      thumbUrl = await this.uploadService.uploadLocalImage(thumb);
    }

   const variant = await this.prisma.productVariant.create({
    data: {
      productId,
      sku: dto.sku,
      barcode: dto.barcode || '',
      priceDelta: Number(dto.priceDelta), // chuyển chuỗi sang Float
      attrValues: typeof dto.attrValues === 'string' ? JSON.parse(dto.attrValues) : dto.attrValues,
      thumb: thumbUrl,
    },
  })

    return {
      success: true,
      message: 'Tạo variant thành công',
      data: new ProductVariantResponseDto(variant),
    };
  }

  async getByProduct(productId: number) {
    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      message: 'Lấy variants thành công',
      data: variants.map((v) => new ProductVariantResponseDto(v)),
    };
  }

  async update(
    id: number,
    dto: UpdateProductVariantDto,
    thumb?: Express.Multer.File, // Nhận file mới
  ) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id } });
    if (!variant)
      return { success: false, message: 'Variant không tồn tại', data: null };

    let thumbUrl = variant.thumb;
    if (thumb) {
      if (variant.thumb) {
        await this.uploadService.deleteLocalImage(variant.thumb); // Xóa ảnh cũ nếu có
      }
      thumbUrl = await this.uploadService.uploadLocalImage(thumb);
    }

   const updated = await this.prisma.productVariant.update({
      where: { id },
      data: {
        sku: dto.sku,
        barcode: dto.barcode || '',
        priceDelta: Number(dto.priceDelta), // convert sang Float
        attrValues: typeof dto.attrValues === 'string' ? JSON.parse(dto.attrValues) : dto.attrValues, // parse JSON
        thumb: thumbUrl,
      },
    })

    return {
      success: true,
      message: 'Cập nhật variant thành công',
      data: new ProductVariantResponseDto(updated),
    };
  }

  async delete(id: number) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id } });
    if (!variant)
      return { success: false, message: 'Variant không tồn tại', data: null };

    if (variant.thumb) {
      await this.uploadService.deleteLocalImage(variant.thumb);
    }

    await this.prisma.productVariant.delete({ where: { id } });

    return { success: true, message: 'Xóa variant thành công', data: null };
  }
}
