import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { UpdateProductReviewDto } from './dto/update-product-review.dto';
import { ProductReviewResponseDto } from './dto/product-review-response.dto';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { ValidationHelper } from 'src/core/helpers/validation.helper';

@Injectable()
export class ProductReviewService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
  ) {
    super(prisma, request);
  }

  async create(dto: CreateProductReviewDto, userId: number) {
    // 1. Kiểm tra bắt buộc phải có orderId và orderItemId
    if (!dto.orderId || !dto.orderItemId) {
      return { 
        success: false, 
        message: 'Bạn chỉ có thể đánh giá sản phẩm đã mua. Vui lòng cung cấp thông tin đơn hàng.' 
      };
    }

    // 2. Kiểm tra sản phẩm có tồn tại trong tenant không
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, tenantId: this.tenantId },
    });
    if (!product) {
      return { success: false, message: 'Sản phẩm không tồn tại' };
    }

    // 3. Kiểm tra người dùng đã đánh giá sản phẩm này chưa
    const existingReview = await this.prisma.productReview.findFirst({
      where: {
        productId: dto.productId,
        userId: userId,
        tenantId: this.tenantId,
      },
    });
    if (existingReview) {
      return { success: false, message: 'Bạn đã đánh giá sản phẩm này rồi' };
    }

    // 4. Kiểm tra đơn hàng có tồn tại và thuộc về user hiện tại không
    const order = await this.prisma.order.findFirst({
      where: { 
        id: dto.orderId, 
        userId: userId, // ← Quan trọng: đảm bảo order thuộc về user
        tenantId: this.tenantId 
      },
    });
    if (!order) {
      return { 
        success: false, 
        message: 'Đơn hàng không tồn tại hoặc không thuộc về bạn' 
      };
    }

    // 5. Kiểm tra orderItem có tồn tại, thuộc đơn hàng này và chứa sản phẩm này không
    const orderItem = await this.prisma.orderItem.findFirst({
      where: { 
        id: dto.orderItemId,
        orderId: dto.orderId, // ← Đảm bảo orderItem thuộc đơn hàng
      },
      include: {
        productVariant: {
          select: {
            productId: true,
          }
        }
      }
    });
    
    if (!orderItem) {
      return { 
        success: false, 
        message: 'Mục đơn hàng không tồn tại hoặc không thuộc đơn hàng này' 
      };
    }

    // 6. Kiểm tra orderItem có chứa sản phẩm đang đánh giá không
    if (orderItem.productVariant?.productId !== dto.productId) {
      return { 
        success: false, 
        message: 'Sản phẩm này không có trong đơn hàng của bạn' 
      };
    }

    // 7. Kiểm tra trạng thái đơn hàng (chỉ cho đánh giá khi đã giao hàng thành công)
    if (order.status !== 'DELIVERED') {
      return { 
        success: false, 
        message: 'Bạn chỉ có thể đánh giá sau khi đơn hàng được giao thành công' 
      };
    }

    // 8. Kiểm tra rating hợp lệ (1-5 sao)
    const rating = ValidationHelper.parseNumber(dto.rating);
    if (!rating || rating < 1 || rating > 5) {
      return { 
        success: false, 
        message: 'Đánh giá phải từ 1 đến 5 sao' 
      };
    }

    // 9. Tạo đánh giá
    const review = await this.prisma.productReview.create({
      data: {
        productId: dto.productId,
        userId: userId,
        rating: rating,
        orderId: dto.orderId,
        orderItemId: dto.orderItemId,
        isPurchased: true, // ← Luôn true vì đã kiểm tra order
        comment: dto.comment || null,
        tenantId: this.tenantId,
      },
    });

    return {
      success: true,
      message: 'Đánh giá sản phẩm thành công',
      data: new ProductReviewResponseDto(review),
    };
  }

  async getProductReviews(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;

    const where: any = { tenantId: this.tenantId };
    if (search) {
      where.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.productReview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { product: true, user: true },
      }),
      this.prisma.productReview.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách đánh giá sản phẩm thành công',
      data: {
        data: reviews.map((r) => new ProductReviewResponseDto(r)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async getProductReviewById(id: number) {
    const review = await this.prisma.productReview.findFirst({
      where: { id, tenantId: this.tenantId },
      include: { product: true, user: true },
    });

    if (!review) {
      return { success: false, message: 'Đánh giá không tồn tại trong tenant' };
    }

    return {
      success: true,
      message: 'Lấy đánh giá sản phẩm thành công',
      data: new ProductReviewResponseDto(review),
    };
  }

  async updateProductReview(id: number, dto: UpdateProductReviewDto, userId: number) {
    // Kiểm tra xem đánh giá có tồn tại không
    const review = await this.prisma.productReview.findFirst({
      where: { id, tenantId: this.tenantId },
    });

    if (!review) {
      return { success: false, message: 'Đánh giá không tồn tại trong tenant' };
    }

    // Kiểm tra quyền chỉnh sửa (chỉ người tạo đánh giá hoặc admin có thể chỉnh sửa)
    if (review.userId !== userId) {
      return { success: false, message: 'Bạn không có quyền chỉnh sửa đánh giá này' };
    }

    // Kiểm tra tính hợp lệ của productId, orderId, orderItemId nếu được cập nhật
    if (dto.productId && dto.productId !== review.productId) {
      const product = await this.prisma.product.findFirst({
        where: { id: dto.productId, tenantId: this.tenantId },
      });
      if (!product) {
        return { success: false, message: 'Sản phẩm không tồn tại trong tenant' };
      }
    }
    if (dto.orderId && dto.orderId !== review.orderId) {
      const order = await this.prisma.order.findFirst({
        where: { id: dto.orderId, tenantId: this.tenantId },
      });
      if (!order) {
        return { success: false, message: 'Đơn hàng không tồn tại trong tenant' };
      }
    }
    if (dto.orderItemId && dto.orderItemId !== review.orderItemId) {
      const orderItem = await this.prisma.orderItem.findFirst({
        where: { id: dto.orderItemId },
      });
      if (!orderItem) {
        return { success: false, message: 'Mục đơn hàng không tồn tại' };
      }
    }

    // Cập nhật đánh giá
    const updated = await this.prisma.productReview.update({
      where: { id },
      data: {
        productId: dto.productId ?? review.productId,
        userId: dto.userId ?? review.userId,
        rating: dto.rating !== undefined ? ValidationHelper.parseNumber(dto.rating) ?? review.rating : review.rating,
        orderId: dto.orderId !== undefined ? ValidationHelper.parseInt(dto.orderId) : review.orderId,
        orderItemId: dto.orderItemId !== undefined ? ValidationHelper.parseInt(dto.orderItemId) : review.orderItemId,
        isPurchased: dto.isPurchased !== undefined ? ValidationHelper.parseBoolean(dto.isPurchased) : review.isPurchased,
        comment: dto.comment ?? review.comment,
      },
    });

    return {
      success: true,
      message: 'Cập nhật đánh giá sản phẩm thành công',
      data: new ProductReviewResponseDto(updated),
    };
  }

  async deleteProductReview(id: number) {
    const review = await this.prisma.productReview.findFirst({
      where: { id, tenantId: this.tenantId },
    });

    if (!review) {
      return { success: false, message: 'Đánh giá không tồn tại trong tenant' };
    }

    await this.prisma.productReview.delete({ where: { id } });

    return {
      success: true,
      message: 'Xóa đánh giá sản phẩm thành công',
    };
  }

  async getProductReviewsByProductId(productId: number, page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;

    // Kiểm tra xem sản phẩm có tồn tại trong tenant không
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId: this.tenantId },
    });
    if (!product) {
      return { success: false, message: 'Sản phẩm không tồn tại trong tenant' };
    }

    const where: any = {
      productId,
      tenantId: this.tenantId,
    };
    if (search) {
      where.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.productReview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { product: true, user: true },
      }),
      this.prisma.productReview.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách đánh giá theo sản phẩm thành công',
      data: {
        data: reviews.map((r) => new ProductReviewResponseDto(r)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }
}