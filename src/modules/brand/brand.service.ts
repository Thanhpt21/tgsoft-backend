import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { UploadService } from '../upload/upload.service'; // Import UploadService
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandResponseDto } from './dto/brand-response.dto';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

@Injectable()
export class BrandService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
    private readonly uploadService: UploadService, // Inject UploadService
  ) {
    super(prisma, request);
  }

  async create(dto: CreateBrandDto, file?: Express.Multer.File) {
    const existing = await this.prisma.brand.findFirst({
      where: { slug: dto.slug, tenantId: this.tenantId },
    });
    if (existing) return { success: false, message: 'Brand slug đã tồn tại' };

    // Upload file nếu có
    let thumbUrl: string | null = null;
    if (file) {
      thumbUrl = await this.uploadService.uploadLocalImage(file);
    }

    const brand = await this.prisma.brand.create({
      data: { 
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        thumb: thumbUrl, // Lưu URL thay vì originalname
        tenantId: this.tenantId
      },
    });

    return {
      success: true,
      message: 'Tạo brand thành công',
      data: new BrandResponseDto(brand),
    };
  }

  async getBrands(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;

    const where: any = { tenantId: this.tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [brands, total] = await this.prisma.$transaction([
      this.prisma.brand.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.brand.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách brand thành công',
      data: {
        data: brands.map((b) => new BrandResponseDto(b)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async getAll(search: string = '') {
    const where: any = { tenantId: this.tenantId };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const brands = await this.prisma.brand.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      message: 'Lấy danh sách brand thành công',
      data: brands.map((b) => new BrandResponseDto(b)),
    };
  }

  async getById(id: number) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) return { success: false, message: 'Brand không tồn tại' };

    return {
      success: true,
      message: 'Lấy brand thành công',
      data: new BrandResponseDto(brand),
    };
  }

  async update(id: number, dto: UpdateBrandDto, file?: Express.Multer.File) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) return { success: false, message: 'Brand không tồn tại' };

    // Upload ảnh mới nếu có
    let thumbUrl = brand.thumb;
    if (file) {
      // Xóa ảnh cũ nếu có
      if (brand.thumb) {
        await this.uploadService.deleteLocalImage(brand.thumb);
      }
      thumbUrl = await this.uploadService.uploadLocalImage(file);
    }

    const updated = await this.prisma.brand.update({
      where: { id },
      data: { 
        ...dto,
        thumb: thumbUrl,
      },
    });

    return {
      success: true,
      message: 'Cập nhật brand thành công',
      data: new BrandResponseDto(updated),
    };
  }

  async delete(id: number) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) return { success: false, message: 'Brand không tồn tại' };

    // Xóa ảnh nếu có
    if (brand.thumb) {
      await this.uploadService.deleteLocalImage(brand.thumb);
    }

    await this.prisma.brand.delete({ where: { id } });

    return { success: true, message: 'Xóa brand thành công' };
  }
}