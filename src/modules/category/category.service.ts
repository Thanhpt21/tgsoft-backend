import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { slugify } from 'src/utils/slugify';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class CategoryService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
    private readonly uploadService: UploadService,
  ) {
    super(prisma, request);
  }

  async create(dto: CreateCategoryDto, thumb?: Express.Multer.File) {
    const slug = dto.slug ?? slugify(dto.name)

    // Kiểm tra slug tồn tại
    const existing = await this.prisma.category.findFirst({
      where: { slug, tenantId: this.tenantId },
    })
    if (existing) return { success: false, message: 'Category slug đã tồn tại' }

    // Xử lý upload ảnh nếu có
    let thumbUrl: string | null = null
    if (thumb) {
      // giả sử bạn có service upload trả về URL
      thumbUrl = await this.uploadService.uploadLocalImage(thumb)
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description ?? null,
        thumb: thumbUrl ?? null,
      position: dto.position !== undefined ? Number(dto.position) : 0,
        status: dto.status ?? 'ACTIVE',
        parentId: dto.parentId ?? null,
        seoTitle: dto.seoTitle ?? null,
        seoDescription: dto.seoDescription ?? null,
        seoKeywords: dto.seoKeywords ?? null,
        tenantId: this.tenantId,
      },
    })

    return {
      success: true,
      message: 'Tạo category thành công',
      data: new CategoryResponseDto(category),
    }
  }

  async getCategories(page = 1, limit = 10, search = '') {
      const skip = (page - 1) * limit;

      const where: any = { tenantId: this.tenantId };
      if (search) {
          where.name = { contains: search, mode: 'insensitive' };
      }

      const [categories, total] = await this.prisma.$transaction([
          this.prisma.category.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { position: 'asc' },
          }),
          this.prisma.category.count({ where }),
      ]);

      return {
          success: true,
          message: 'Lấy danh sách category thành công',
          data: {
          data: categories.map(c => new CategoryResponseDto(c)),
          total,
          page,
          pageCount: Math.ceil(total / limit),
          },
      };
      }

  async getAll(search = '') {
  const where: any = { tenantId: this.tenantId };

  if (search) {
      where.name = { contains: search, mode: 'insensitive' };
  }

  const categories = await this.prisma.category.findMany({
      where,
      orderBy: { position: 'asc' },
  });

  return {
      success: true,
      message: 'Lấy danh sách category thành công',
      data: categories.map(c => new CategoryResponseDto(c)),
  };
  }


  async getById(id: number) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId: this.tenantId },
    });
    if (!category) return { success: false, message: 'Category không tồn tại' };
    return { success: true, data: new CategoryResponseDto(category) };
  }

  async update(id: number, dto: UpdateCategoryDto, thumb?: Express.Multer.File) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId: this.tenantId },
    })
    if (!category) return { success: false, message: 'Category không tồn tại' }

    // Xử lý upload ảnh mới nếu có
    let thumbUrl = category.thumb
    if (thumb) {
      thumbUrl = await this.uploadService.uploadLocalImage(thumb)
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name ?? category.name,
        slug: dto.slug ?? category.slug,
        description: dto.description ?? category.description,
        thumb: thumbUrl,
        position: dto.position !== undefined ? Number(dto.position) : category.position,
        status: dto.status ?? category.status,
        parentId: dto.parentId ?? category.parentId,
        seoTitle: dto.seoTitle ?? category.seoTitle,
        seoDescription: dto.seoDescription ?? category.seoDescription,
        seoKeywords: dto.seoKeywords ?? category.seoKeywords,
      },
    })

    return {
      success: true,
      message: 'Cập nhật category thành công',
      data: new CategoryResponseDto(updated),
    }
  }

  async delete(id: number) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId: this.tenantId },
    });
    if (!category) return { success: false, message: 'Category không tồn tại' };

    await this.prisma.category.delete({ where: { id } });
    return { success: true, message: 'Xóa category thành công' };
  }
}
