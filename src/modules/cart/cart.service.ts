import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service'; // Chắc chắn đường dẫn đúng
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { MergeCartDto } from './dto/merge-cart.dto';

@Injectable()
export class CartService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
  ) {
    // Gọi constructor của TenantAwareService để thiết lập this.tenantId và this.userId
    super(prisma, request);
  }


  async getCartByUser(userId: number) {
    return this.prisma.cart.findFirst({
      where: { 
        userId: userId,
        tenantId: this.tenantId,
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true, // Include thông tin product
              },
            },
          },
        },
      },
    });
  }


  async addItemToCart(userId: number, dto: AddCartItemDto) {
    const { productVariantId, quantity } = dto;

    // 1. Lấy tổng tồn kho variant trong tất cả kho (Chỉ trong tenant hiện tại)
    const inventories = await this.prisma.inventory.findMany({
      where: { productVariantId },
    });
    const totalStock = inventories.reduce((sum, item) => sum + item.qty, 0);

    // 2. Tính tổng số lượng variant đã được đặt trong các đơn hàng chưa hủy
    const reservedOrders = await this.prisma.orderItem.aggregate({
      where: {
        productVariantId,
        order: {
          tenantId: this.tenantId, // Bắt buộc lọc theo Tenant
          status: {
            notIn: ['CANCELLED', 'REFUNDED'],
          },
        },
      },
      _sum: {
        quantity: true,
      },
    });
    const reservedQty = reservedOrders._sum.quantity ?? 0;

    // 3. Tính tồn kho khả dụng
    const availableQty = totalStock - reservedQty;

    // 4. Lấy hoặc tạo giỏ hàng của user
    // (Cart được đảm bảo là duy nhất cho cặp userId/tenantId)
    let cart = await this.prisma.cart.findUnique({
      where: { userId: userId, tenantId: this.tenantId },
    });
    
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId: userId,
          tenantId: this.tenantId,
        },
      });
    }

    // 5. Lấy item hiện tại trong cart nếu có
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productVariantId: {
          cartId: cart.id,
          productVariantId,
        },
      },
    });

    // 6. Tính tổng số lượng yêu cầu
    const totalRequested = quantity + (existingItem?.quantity || 0);

    // 7. Kiểm tra tồn kho khả dụng
    if (totalRequested > availableQty) {
      throw new BadRequestException(
        `Sản phẩm vượt quá tồn kho khả dụng (${availableQty}). Bạn chỉ có thể thêm tối đa ${availableQty - (existingItem?.quantity || 0)} sản phẩm nữa.`
      );
    }

    // 8. Thêm hoặc cập nhật cart item
    // Lấy giá trị priceAtAdd từ variant + product
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: productVariantId },
      include: { product: true },
    });

    if (!variant) throw new BadRequestException('Variant không tồn tại');

    const priceAtAdd = variant.priceDelta;
    const cartItem = await this.prisma.cartItem.upsert({
      where: {
        cartId_productVariantId: {
          cartId: cart.id,
          productVariantId,
        },
      },
      update: {
        quantity: {
          increment: quantity,
        },
      },
      create: {
        cartId: cart.id,
        productVariantId,
        quantity,
        priceAtAdd, // ✅ bây giờ đã có giá trị
      },
    });

    return {
      success: true,
      message: 'Thêm sản phẩm vào giỏ hàng thành công',
      data: cartItem,
    };
  }


    async updateCartItem(userId: number, itemId: number, dto: UpdateCartItemDto) {
      // 1. Lấy giỏ hàng của user
      const cart = await this.getCartByUser(userId);
      if (!cart) throw new NotFoundException('Giỏ hàng không tồn tại.');

      // 2. Lấy item cần update
      const item = await this.prisma.cartItem.findUnique({
        where: { id: itemId },
      });
      if (!item || item.cartId !== cart.id) {
        throw new NotFoundException('Sản phẩm không tồn tại trong giỏ hàng.');
      }

      // 3. Nếu cập nhật quantity, kiểm tra tồn kho tương tự addItemToCart
      if (dto.quantity !== undefined) {
        const productVariantId = item.productVariantId;

        // Tính tồn kho tổng (giống addItemToCart)
        const inventories = await this.prisma.inventory.findMany({
          where: { productVariantId },
        });
        const totalStock = inventories.reduce((sum, i) => sum + i.qty, 0);

        // Tính số lượng đã được đặt trong đơn hàng chưa hủy
        const reservedOrders = await this.prisma.orderItem.aggregate({
          where: {
            productVariantId,
            order: {
              tenantId: this.tenantId,
              status: { notIn: ['CANCELLED', 'REFUNDED'] },
            },
          },
          _sum: { quantity: true },
        });
        const reservedQty = reservedOrders._sum.quantity ?? 0;

        // Tồn kho khả dụng
        const availableQty = totalStock - reservedQty;

        if (dto.quantity > availableQty) {
          throw new BadRequestException(
            `Số lượng yêu cầu vượt quá tồn kho khả dụng (${availableQty}).`
          );
        }
      }

      // 4. Cập nhật item
      const updatedItem = await this.prisma.cartItem.update({
        where: { id: itemId },
        data: dto,
      });

      return {
        success: true,
        message: 'Cập nhật số lượng item thành công',
        data: updatedItem,
      };
    }

  /**
   * Xóa một item khỏi giỏ hàng của user hiện tại.
   */
  async removeCartItem(userId: number, itemId: number) {
    // Lấy giỏ hàng user
    const cart = await this.getCartByUser(userId);
    if (!cart) throw new NotFoundException('Giỏ hàng không tồn tại.');

    // Kiểm tra item có thuộc giỏ hàng user
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.cartId !== cart.id) {
      throw new NotFoundException('Sản phẩm không tồn tại trong giỏ hàng của bạn.');
    }

    // Xóa item theo id
    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return { success: true, message: 'Xóa sản phẩm khỏi giỏ hàng thành công' };
  }

  /**
   * Hợp nhất (merge) giỏ hàng tạm thời (client side) vào giỏ hàng của người dùng đã đăng nhập.
   */
  async mergeClientCart(userId: number, dto: MergeCartDto ) {
    // Sử dụng this.userId và this.tenantId
    let cart = await this.prisma.cart.findUnique({ 
        where: { 
            userId: userId,
            tenantId: this.tenantId,
        } 
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId: userId, tenantId: this.tenantId },
      });
    }

    const existingItems = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
    });

    const existingMap = new Map<number, number>();
    for (const item of existingItems) {
      existingMap.set(item.productVariantId, item.quantity);
    }

  

    for (const clientItem of dto.items) {
      const currentQty = existingMap.get(clientItem.productVariantId) || 0;
      const newQty = currentQty + clientItem.quantity;
      
      // TODO: Thêm logic kiểm tra tồn kho cho Merge Cart tương tự như addItemToCart
      // Lưu ý: Logic kiểm tra tồn kho phải được áp dụng trước khi upsert.
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: clientItem.productVariantId },
        include: { product: true },
      });
      if (!variant) throw new BadRequestException('Variant không tồn tại');

      const priceAtAdd = variant.priceDelta;

      await this.prisma.cartItem.upsert({
        where: {
          cartId_productVariantId: {
            cartId: cart.id,
            productVariantId: clientItem.productVariantId,
          },
        },
        update: {
          quantity: newQty,
        },
        create: {
          cartId: cart.id,
          productVariantId: clientItem.productVariantId,
          quantity: clientItem.quantity,
           priceAtAdd,
        },
      });
    }

    return { success: true, message: 'Hợp nhất giỏ hàng thành công' };
  }

  // async checkoutCartToOrder(userId: number) {
  //   // Lấy giỏ hàng user, bao gồm variant và product trong variant
  //   const cart = await this.prisma.cart.findUnique({
  //     where: { userId },
  //     include: { 
  //       items: { 
  //         include: { 
  //           variant: { 
  //             include: { product: true } 
  //           } 
  //         } 
  //       } 
  //     },
  //   });

  //   if (!cart) throw new NotFoundException('Giỏ hàng không tồn tại.');

  //   if (cart.items.length === 0) {
  //     throw new BadRequestException('Giỏ hàng của bạn đang trống.');
  //   }

  //   // Tính tổng tiền
  //   const totalAmount = cart.items.reduce((sum, item) => {
  //     const unitPrice = item.variant.priceDelta;
  //     return sum + unitPrice * item.quantity;
  //   }, 0);

  //   // Tạo đơn hàng
  //   const order = await this.prisma.order.create({
  //     data: {
  //       userId,
  //       tenantId: cart.tenantId,
  //       totalAmount,
  //       currency: 'VND',
  //       status: 'DRAFT',
  //       paymentStatus: 'PENDING',
  //       items: {
  //         create: cart.items.map(item => ({
  //           productVariantId: item.productVariantId,
  //           quantity: item.quantity,
  //           sku: item.variant.sku,
  //           unitPrice: item.variant.priceDelta,
  //         })),
  //       },
  //     },
  //     include: {
  //       items: true,
  //     },
  //   });

  //   // Xóa hết các item trong giỏ hàng
  //   await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  //   return {
  //     success: true,
  //     message: 'Chuyển giỏ hàng thành đơn hàng thành công',
  //     data: order,
  //   };
  // }

}
