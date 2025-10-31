import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { Prisma, OrderStatus, PaymentStatus } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class OrdersService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    private readonly inventoryService: InventoryService, 
    @Inject(REQUEST) protected readonly request: Request | any,

  ) {
    super(prisma, request);
  }

  // Tạo đơn hàng
async create(userId: number, dto: CreateOrderDto) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new BadRequestException(`User ID ${userId} không tồn tại`);
  if (!user.tenantId)
    throw new BadRequestException('Người dùng không có tenant, không thể tạo đơn hàng');

  if (!dto.items?.length) {
    throw new BadRequestException('Thiếu thông tin items');
  }

  // Kiểm tra variant tồn tại và đủ kho
  for (const item of dto.items) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: item.productVariantId },
      include: { inventory: true }, // Lấy thông tin kho
    });

    if (!variant) {
      throw new BadRequestException(`Không tìm thấy variant có id = ${item.productVariantId}`);
    }

    // Kiểm tra warehouseId
    if (!item.warehouseId) {
      throw new BadRequestException(`Thiếu warehouseId cho variant ${item.productVariantId}`);
    }

    // Kiểm tra kho
    const inventory = await this.prisma.inventory.findFirst({
      where: { productVariantId: item.productVariantId, warehouseId: item.warehouseId },
    });

    if (!inventory) {
      throw new BadRequestException(`Không tìm thấy sản phẩm này tại kho này`);
    }

    if (dto.status && ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(dto.status)) {
      if (inventory.qty < item.quantity) {
        throw new BadRequestException(`Số lượng tồn kho không đủ tại kho này`);
      }
    }
  }

  const totalAmount = dto.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  // Tạo đơn hàng
  const order = await this.prisma.order.create({
    data: {
      userId: userId,
      tenantId: user.tenantId,
      totalAmount,
      currency: 'VND',
      status: dto.status ?? OrderStatus.DRAFT,
      paymentStatus: dto.paymentStatus ?? PaymentStatus.PENDING,
      shippingFee: dto.shippingFee ?? 0,
      paymentMethodId: dto.paymentMethodId ?? null,
      deliveryMethod: dto.deliveryMethod || undefined,
      shippingInfo: dto.shippingInfo
        ? (dto.shippingInfo as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      inventoryUpdated: null, // Khởi tạo inventoryUpdated
    },
  });

  // Tạo order items
  await this.prisma.orderItem.createMany({
    data: dto.items.map((item) => ({
      orderId: order.id,
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      sku: item.sku ?? '',
      warehouseId: item.warehouseId, // Lưu warehouseId
    })),
  });

  // Cập nhật kho nếu trạng thái ban đầu thuộc nhóm trừ kho
  const deductStatuses = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  if (dto.status && deductStatuses.includes(dto.status)) {
    await this.updateInventoryFromOrder(order.id, dto.status, 'DEDUCT');
    await this.prisma.order.update({
      where: { id: order.id },
      data: { inventoryUpdated: 'DEDUCTED' },
    });
  }

  // Lấy order đầy đủ quan hệ để trả về frontend
  const created = await this.prisma.order.findUnique({
    where: { id: order.id },
    include: {
      items: {
        include: {
          productVariant: {
            include: { product: true },
          },
        },
      },
      payments: true,
      user: true,
    },
  });

  if (!created) {
    throw new BadRequestException('Không tìm thấy order sau khi tạo');
  }

  return {
    success: true,
    message: 'Tạo đơn hàng thành công',
    data: new OrderResponseDto(created),
  };
}

  // Lấy danh sách order (có phân trang, tìm kiếm)
  async getOrders(
    page = 1,
    limit = 10,
    userId?: number,
    status?: string,
    search = '',
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status as OrderStatus;

    // Nếu muốn tìm kiếm theo ID hoặc tên người nhận (JSON shippingInfo)
    if (search) {
      where.OR = [
        { id: Number.isNaN(+search) ? undefined : +search },
        { shippingInfo: { path: ['to', 'name'], string_contains: search } }, // Prisma 5+
      ].filter(Boolean);
    }

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: {
            include: { productVariant: { include: { product: true } } },
          },
          payments: true,
          user: true,
          paymentMethod: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách order thành công',
      data: {
        data: orders.map((o) => new OrderResponseDto(o as any)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // Lấy chi tiết order theo ID
  async getOrderById(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { productVariant: { include: { product: true } } } },
        payments: true,
        user: true,
      },
    });

    if (!order)
      return { success: false, message: 'Order không tồn tại', data: null };

    return {
      success: true,
      message: 'Lấy order thành công',
      data: new OrderResponseDto(order),
    };
  }

async updateOrder(id: number, dto: UpdateOrderDto) {
  const existing = await this.prisma.order.findUnique({ 
    where: { id },
    select: { id: true, status: true, inventoryUpdated: true }, // Lấy thêm inventoryUpdated
  });
  if (!existing) return { success: false, message: 'Order không tồn tại' };

  // Kiểm tra trạng thái cũ và mới
  const oldStatus = existing.status;
  const newStatus = dto.status;

  if (!newStatus) {
    return { success: false, message: 'Trạng thái đơn hàng không hợp lệ' };
  }

  // Xác định nhóm trạng thái
  const deductStatuses = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const restoreStatuses = ['CANCELLED', 'REFUNDED'];

  // Cập nhật đơn hàng
  const updated = await this.prisma.order.update({
    where: { id },
    data: {
      ...dto,
      shippingInfo: dto.shippingInfo
        ? (dto.shippingInfo as unknown as Prisma.InputJsonValue)
        : undefined,
    },
    include: {
      items: { include: { productVariant: { include: { product: true } } } },
      payments: true,
      user: true,
    },
  });

  // Logic cập nhật kho
  if (deductStatuses.includes(newStatus) && existing.inventoryUpdated !== 'DEDUCTED') {
    // Trừ kho nếu chưa trừ và trạng thái mới thuộc nhóm trừ kho
    await this.updateInventoryFromOrder(id, newStatus, 'DEDUCT');
    await this.prisma.order.update({
      where: { id },
      data: { inventoryUpdated: 'DEDUCTED' },
    });
  } else if (restoreStatuses.includes(newStatus) && existing.inventoryUpdated !== 'RESTORED') {
    // Cộng kho nếu chưa cộng và trạng thái mới thuộc nhóm cộng kho
    await this.updateInventoryFromOrder(id, newStatus, 'RESTORE');
    await this.prisma.order.update({
      where: { id },
      data: { inventoryUpdated: 'RESTORED' },
    });
  }

  return {
    success: true,
    message: 'Cập nhật order thành công',
    data: new OrderResponseDto(updated),
  };
}

async updateInventoryFromOrder(orderId: number, newStatus: OrderStatus, action: 'DEDUCT' | 'RESTORE') {
  const order = await this.prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  });

  if (!order) {
    return { success: false, message: 'Không tìm thấy đơn hàng' };
  }

  const inventoryUpdatePromises = order.items.map(async (item) => {
    const variant = item.productVariantId;
    const quantity = item.quantity;
    const warehouseId = item.warehouseId;

    if (!warehouseId) {
      return { success: false, message: 'Không có thông tin kho (warehouseId) cho sản phẩm' };
    }

    const inventory = await this.prisma.inventory.findFirst({
      where: { productVariantId: variant, warehouseId },
    });

    if (!inventory) {
      return { success: false, message: 'Không tìm thấy inventory cho variant này' };
    }

    // Cập nhật kho dựa trên action
    if (action === 'DEDUCT') {
      await this.prisma.inventory.update({
        where: { id: inventory.id },
        data: { qty: inventory.qty - quantity },
      });
    } else if (action === 'RESTORE') {
      await this.prisma.inventory.update({
        where: { id: inventory.id },
        data: { qty: inventory.qty + quantity },
      });
    }

    return { success: true, message: `Cập nhật kho cho variant ${variant} thành công` };
  });

  const results = await Promise.all(inventoryUpdatePromises);

  return { success: true, message: 'Cập nhật kho từ đơn hàng thành công', data: results };
}


  // Xóa order
  async deleteOrder(id: number) {
    const existing = await this.prisma.order.findUnique({ where: { id } });
    if (!existing) return { success: false, message: 'Order không tồn tại' };

    await this.prisma.order.delete({ where: { id } });

    return { success: true, message: 'Xóa order thành công' };
  }

  async getOrdersByUser(userId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    // Lọc theo userId
    const orders = await this.prisma.order.findMany({
      where: { userId },
      skip,
      take: Number(limit),
      include: {
        items: {
          include: { productVariant: { include: { product: true } } },
        },
        payments: true,
        user: true,
        paymentMethod: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.order.count({ where: { userId } });

    return {
      success: true,
      message: 'Lấy danh sách đơn hàng của người dùng thành công',
      data: {
        data: orders.map((order) => new OrderResponseDto(order as any)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async checkUserPurchasedProduct(productId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        userId: userId,
        tenantId: this.tenantId,
        status: OrderStatus.DELIVERED
      },
      include: {
        items: {
          where: {
            productVariant: {
              productId: productId
            }
          },
          include: {
            productVariant: {
              select: {
                id: true,
                productId: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Lấy order mới nhất
      }
    });

    // Nếu không tìm thấy order hoặc order không có item nào
    if (!order || !order.items || order.items.length === 0) {
      return {
        success: true,
        data: {
          hasPurchased: false,
          orderId: null,
          orderItemId: null
        }
      };
    }

    // Lấy item đầu tiên (nếu có nhiều lần mua cùng sản phẩm)
    const firstItem = order.items[0];

    return {
      success: true,
      data: {
        hasPurchased: true,
        orderId: order.id,
        orderItemId: firstItem.id,
        orderStatus: order.status,
        purchasedAt: order.createdAt
      }
    };
  }
}
