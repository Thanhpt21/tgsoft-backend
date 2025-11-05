import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { slugify } from 'src/utils/slugify';
import { Prisma } from '@prisma/client';
import { UploadService } from '../upload/upload.service';
import { ValidationHelper } from 'src/core/helpers/validation.helper';

@Injectable()
export class ProductService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
    private readonly uploadService: UploadService,
  ) {
    super(prisma, request);
  }

async create(dto: CreateProductDto, userId: number, thumb?: Express.Multer.File, images?: Express.Multer.File[]) {
  const existing = await this.prisma.product.findFirst({
    where: { 
      tenantId: this.tenantId,
      OR: [{ name: dto.name }, { slug: dto.slug }]
    },
  });
  if (existing) {
    return { 
      success: false, 
      message: `${existing.name === dto.name ? 'Tên' : 'Slug'} product đã tồn tại` 
    };
  }

  // Upload images
  let thumbUrl: string | null = null;
  let imagesUrls: string[] = [];

  try {
    if (thumb) {
      thumbUrl = await this.uploadService.uploadLocalImage(thumb);
    }
    if (images?.length) {
      imagesUrls = await Promise.all(
        images.map(file => this.uploadService.uploadLocalImage(file))
      );
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Upload hình ảnh thất bại',
      error: error.message 
    };
  }


  // Create product
  const product = await this.prisma.product.create({
    data: {
      name: dto.name,
      slug: dto.slug,
      description: dto.description || null,
      basePrice: ValidationHelper.parseNumber(dto.basePrice) ?? 0,
      thumb: thumbUrl,
      images: imagesUrls.length ? imagesUrls : Prisma.JsonNull,
      status: dto.status || 'ACTIVE',
      isPublished: ValidationHelper.parseBoolean(dto.isPublished), 
      isFeatured: ValidationHelper.parseBoolean(dto.isFeatured),   
      categoryId: ValidationHelper.parseInt(dto.categoryId),
      brandId: ValidationHelper.parseInt(dto.brandId),
      seoTitle: dto.seoTitle || null,
      seoDescription: dto.seoDescription || null,
      seoKeywords: dto.seoKeywords || null,
      weight: ValidationHelper.parseNumber(dto.weight),
      length: ValidationHelper.parseNumber(dto.length),
      width: ValidationHelper.parseNumber(dto.width),
      height: ValidationHelper.parseNumber(dto.height),
      tenantId: this.tenantId,
      createdById: userId,
    },
  });

  return {
    success: true,
    message: 'Tạo product thành công',
    data: new ProductResponseDto(product),
  };
}

async getProductBySlug(slug: string) {
  const now = new Date();

  const product = await this.prisma.product.findFirst({
    where: {
      slug,
      tenantId: this.tenantId,
    },
    include: {
      attributes: {
        include: { attribute: true },
      },
      promotionProducts: {
        include: {
          promotion: true,
          giftProduct: true,
        },
      },
    },
  });

  if (!product) {
    return { success: false, message: 'Product không tồn tại' };
  }

  // Lọc promotion hợp lệ: chỉ ACTIVE và trong khoảng thời gian
  const validPromotions = product.promotionProducts.filter((pp) => {
    const promo = pp.promotion;
    return (
      promo.status === 'ACTIVE' &&
      promo.startTime <= now &&
      promo.endTime >= now
    );
  });

  return {
    success: true,
    message: 'Lấy sản phẩm và khuyến mãi thành công',
    data: {
      ...new ProductResponseDto(product),
      promotionProducts: validPromotions,
    },
  };
}

async getAllProductsWithSearch(search: string = '') {
  try {
    const where: any = {
      tenantId: this.tenantId, // Lọc theo tenantId
    };

    // Tìm kiếm sản phẩm theo tên hoặc slug
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Lấy tất cả sản phẩm (đã lọc theo tenantId)
    const products = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { attributes: { include: { attribute: true } } },
    });

    return {
      success: true,
      message: 'Lấy danh sách sản phẩm thành công',
      data: products.map((p) => new ProductResponseDto(p)),
    };
  } catch (error) {
    return { success: false, message: 'Lỗi khi truy vấn dữ liệu', error: error.message };
  }
}

async getPromotedProductsWithSearch(
  page = 1,
  limit = 10,
  search = '',
  brandId?: number,
  categoryId?: number,
  sortBy = 'createdAt_desc' // Thêm sortBy
) {
  const skip = (page - 1) * limit;

  // Điều kiện lọc cơ bản theo tenantId và sản phẩm có khuyến mãi
  const where: Prisma.ProductWhereInput = {
    tenantId: this.tenantId,
    promotionProducts: {
      some: {
        promotion: {
          status: { in: ['ACTIVE', 'SCHEDULED'] },
          startTime: { lte: new Date() },
          endTime: { gte: new Date() },
        },
      },
    },
  };

  // Điều kiện tìm kiếm theo tên sản phẩm (nếu có)
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }, // Tìm kiếm theo mô tả
    ];
  }

  // Điều kiện lọc theo brandId (nếu có)
  if (brandId) {
    where.brandId = brandId;
  }

  // Điều kiện lọc theo categoryId (nếu có)
  if (categoryId) {
    where.categoryId = categoryId;
  }

  // Xử lý các điều kiện sắp xếp (sortBy)
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }; // Mặc định là sắp xếp theo createdAt

  switch (sortBy) {
    case 'price_asc':
      orderBy = { basePrice: 'asc' }; // Sắp xếp theo giá từ thấp đến cao
      break;
    case 'price_desc':
      orderBy = { basePrice: 'desc' }; // Sắp xếp theo giá từ cao xuống thấp
      break;
    case 'createdAt_asc':
      orderBy = { createdAt: 'asc' }; // Sắp xếp theo ngày tạo từ cũ đến mới
      break;
    case 'createdAt_desc':
    default:
      orderBy = { createdAt: 'desc' }; // Mặc định là sắp xếp theo ngày tạo mới nhất
      break;
  }

  // Truy vấn sản phẩm và đếm tổng số sản phẩm
  const [products, total] = await this.prisma.$transaction([
    this.prisma.product.findMany({
      where,
      skip,   // Phân trang
      take: limit, // Giới hạn số lượng sản phẩm trả về
      orderBy,  // Sắp xếp theo điều kiện
      include: {
        promotionProducts: {
          where: {
            promotion: {
              status: 'ACTIVE',
              startTime: { lte: new Date() },
              endTime: { gte: new Date() },
            },
          },
          include: {
            promotion: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        attributes: { include: { attribute: true } },
      },
    }),
    this.prisma.product.count({ where }),  // Đếm tổng số sản phẩm thỏa mãn điều kiện
  ]);

  // Trả về dữ liệu
  return {
    success: true,
    message: 'Lấy danh sách sản phẩm có khuyến mãi thành công',
    data: {
      data: products.map((p) => new ProductResponseDto(p)),
      total,
      page,
      pageCount: Math.ceil(total / limit),  // Tính số trang
    },
  };
}
async getNonPromotedProductsWithSearch(
  page = 1,
  limit = 10,
  search = '',
  brandId?: number,
  categoryId?: number,
  sortBy = 'createdAt_desc' // Thêm sortBy
) {
  const skip = (page - 1) * limit;

  // Điều kiện lọc cơ bản theo tenantId và sản phẩm không có khuyến mãi
  const where: Prisma.ProductWhereInput = {
    tenantId: this.tenantId,
    promotionProducts: {
      none: {}, // Không có khuyến mãi nào gắn với sản phẩm
    },
  };

  // Điều kiện tìm kiếm theo tên sản phẩm (nếu có)
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }, // Tìm kiếm theo mô tả
    ];
  }

  // Điều kiện lọc theo brandId (nếu có)
  if (brandId) {
    where.brandId = brandId;
  }

  // Điều kiện lọc theo categoryId (nếu có)
  if (categoryId) {
    where.categoryId = categoryId;
  }

  // Xử lý các điều kiện sắp xếp (sortBy)
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }; // Mặc định là sắp xếp theo createdAt

  switch (sortBy) {
    case 'price_asc':
      orderBy = { basePrice: 'asc' }; // Sắp xếp theo giá từ thấp đến cao
      break;
    case 'price_desc':
      orderBy = { basePrice: 'desc' }; // Sắp xếp theo giá từ cao xuống thấp
      break;
    case 'createdAt_asc':
      orderBy = { createdAt: 'asc' }; // Sắp xếp theo ngày tạo từ cũ đến mới
      break;
    case 'createdAt_desc':
    default:
      orderBy = { createdAt: 'desc' }; // Mặc định là sắp xếp theo ngày tạo mới nhất
      break;
  }

  // Truy vấn sản phẩm và đếm tổng số sản phẩm
  const [products, total] = await this.prisma.$transaction([
    this.prisma.product.findMany({
      where,
      skip,   // Phân trang
      take: limit, // Giới hạn số lượng sản phẩm trả về
      orderBy,  // Sắp xếp theo điều kiện
      include: { attributes: { include: { attribute: true } } },
    }),
    this.prisma.product.count({ where }),  // Đếm tổng số sản phẩm thỏa mãn điều kiện
  ]);

  // Trả về dữ liệu
  return {
    success: true,
    message: 'Lấy danh sách sản phẩm không có khuyến mãi thành công',
    data: {
      data: products.map((p) => new ProductResponseDto(p)),
      total,
      page,
      pageCount: Math.ceil(total / limit),  // Tính số trang
    },
  };
}

async getProducts(
  page = 1,
  limit = 10,
  search = '',
  brandId?: number,
  categoryId?: number,
  sortBy = 'createdAt_desc'
) {
  const skip = (page - 1) * limit;

  // Điều kiện lọc cơ bản theo tenantId
  const where: Prisma.ProductWhereInput = {
    tenantId: this.tenantId,
  };

  // Tìm kiếm theo tên, slug, mô tả
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }, // Thêm mô tả
    ];
  }

  // Lọc theo brandId
  if (brandId) {
    where.brandId = brandId;
  }

  // Lọc theo categoryId
  if (categoryId) {
    where.categoryId = categoryId;
  }

  // Xử lý sắp xếp
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };

  switch (sortBy) {
    case 'price_asc':
      orderBy = { basePrice: 'asc' };
      break;
    case 'price_desc':
      orderBy = { basePrice: 'desc' };
      break;
    case 'createdAt_asc':
      orderBy = { createdAt: 'asc' };
      break;
    case 'createdAt_desc':
    default:
      orderBy = { createdAt: 'desc' };
      break;
  }

  // Truy vấn sản phẩm + đếm
  const [products, total] = await this.prisma.$transaction([
    this.prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        // Lấy attributes
        attributes: {
          include: { attribute: true },
        },
        // Lấy promotionProducts nếu đang ACTIVE/SCHEDULED và trong thời gian
        promotionProducts: {
          where: {
            promotion: {
              status: { in: ['ACTIVE', 'SCHEDULED'] },
              startTime: { lte: new Date() },
              endTime: { gte: new Date() },
            },
          },
          include: {
            promotion: {
              select: {
                id: true,
                name: true,
                isFlashSale: true, // Nếu cần
              },
            },
            giftProduct: {
              select: {
                id: true,
                name: true,
                thumb: true,
              },
            },
          },
        },
      },
    }),
    this.prisma.product.count({ where }),
  ]);

  return {
    success: true,
    message: 'Lấy danh sách sản phẩm thành công',
    data: {
      data: products.map((p) => new ProductResponseDto(p)),
      total,
      page,
      pageCount: Math.ceil(total / limit),
    },
  };
}


async getProductById(id: number) {
  const product = await this.prisma.product.findFirst({
    where: { id, tenantId: this.tenantId },
    include: {
      attributes: { include: { attribute: true } },
      promotionProducts: {
        include: { promotion: true },
      },
    },
  });

  if (!product)
    return { success: false, message: 'Product không tồn tại trong tenant' };

  const now = new Date();

  // Lọc promotion hợp lệ: chỉ lấy ACTIVE và trong khoảng thời gian
  const validPromotions = product.promotionProducts.filter((pp) => {
    const promo = pp.promotion;
    return (
      promo.status === 'ACTIVE' &&
      promo.startTime <= now &&
      promo.endTime >= now
    );
  });

  // Trả về product với promotion đã lọc
  return {
    success: true,
    message: 'Lấy product thành công',
    data: {
      ...new ProductResponseDto(product),
      promotionProducts: validPromotions,
    },
  };
}



async updateProduct(
  id: number,
  dto: UpdateProductDto,
  thumb?: Express.Multer.File,
  images?: Express.Multer.File[]
) {
  // 1. Check product exists
  const product = await this.prisma.product.findFirst({
    where: { id, tenantId: this.tenantId },
  });

  if (!product) {
    return { success: false, message: 'Product không tồn tại trong tenant' };
  }

  // 2. Check duplicate name/slug (nếu có thay đổi)
    if (dto.name || dto.slug) {
    const whereCondition: any = {
      id: { not: id },
      tenantId: this.tenantId,
    };

    if (dto.name && dto.slug) {
      whereCondition.OR = [{ name: dto.name }, { slug: dto.slug }];
    } else if (dto.name) {
      whereCondition.name = dto.name;
    } else if (dto.slug) {
      whereCondition.slug = dto.slug;
    }

    const existing = await this.prisma.product.findFirst({
      where: whereCondition,
    });

    if (existing) {
      return {
        success: false,
        message: `${existing.name === dto.name ? 'Tên' : 'Slug'} product đã tồn tại`,
      };
    }
  }

  // 3. Upload files mới (nếu có)
  let thumbUrl = product.thumb;
  let imagesUrls: string[] = ValidationHelper.parseArray(product.images) || [];

  if (thumb) {
    thumbUrl = await this.uploadService.uploadLocalImage(thumb);
  }

  if (images?.length) {
    imagesUrls = await Promise.all(
      images.map((file) => this.uploadService.uploadLocalImage(file))
    );
  }

  // 4. Update product
  const updated = await this.prisma.product.update({
    where: { id },
    data: {
      name: dto.name ?? product.name,
      slug: dto.slug ?? product.slug,
      description: dto.description ?? product.description,
      basePrice: dto.basePrice ? (ValidationHelper.parseNumber(dto.basePrice) ?? product.basePrice) : product.basePrice,
      thumb: thumbUrl,
      images: imagesUrls.length ? imagesUrls : Prisma.JsonNull,
      status: dto.status ?? product.status,
      isPublished: dto.isPublished !== undefined ? ValidationHelper.parseBoolean(dto.isPublished) : product.isPublished,
      isFeatured: dto.isFeatured !== undefined ? ValidationHelper.parseBoolean(dto.isFeatured) : product.isFeatured,
      categoryId: dto.categoryId !== undefined ? ValidationHelper.parseInt(dto.categoryId) : product.categoryId,
      brandId: dto.brandId !== undefined ? ValidationHelper.parseInt(dto.brandId) : product.brandId,
      seoTitle: dto.seoTitle ?? product.seoTitle,
      seoDescription: dto.seoDescription ?? product.seoDescription,
      seoKeywords: dto.seoKeywords ?? product.seoKeywords,
      weight: dto.weight !== undefined ? ValidationHelper.parseNumber(dto.weight) : product.weight,
      length: dto.length !== undefined ? ValidationHelper.parseNumber(dto.length) : product.length,
      width: dto.width !== undefined ? ValidationHelper.parseNumber(dto.width) : product.width,
      height: dto.height !== undefined ? ValidationHelper.parseNumber(dto.height) : product.height,
     
    },
  });

  return {
    success: true,
    message: 'Cập nhật product thành công',
    data: new ProductResponseDto(updated),
  };
}

  async deleteProduct(id: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId: this.tenantId },
    });
    if (!product)
      return { success: false, message: 'Product không tồn tại trong tenant' };

    await this.prisma.product.delete({ where: { id } });

    return {
      success: true,
      message: 'Xóa product thành công',
    };
  }

  async getAllProductsByTenantId(overrideTenantId?: number) {
  const tenantId = overrideTenantId ?? this.tenantId;

  try {
    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
      },
      include: {
        attributes: {
          include: { attribute: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      message: 'Lấy tất cả sản phẩm thành công',
      data: products.map(p => new ProductResponseDto(p)),
    };
  } catch (error) {
    return {
      success: false,
      message: 'Lỗi khi lấy danh sách sản phẩm',
      error: error instanceof Error ? error.message : String(error),
    };
  }
  }

}

