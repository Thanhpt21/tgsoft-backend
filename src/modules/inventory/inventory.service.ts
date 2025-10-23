import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { InventoryResponseDto } from './dto/inventory-response.dto';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

@Injectable()
export class InventoryService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
  ) {
    super(prisma, request);
  }

  async create(dto: CreateInventoryDto) {
    // Kiểm tra inventory đã tồn tại với productVariantId và warehouseId chưa
    const existing = await this.prisma.inventory.findFirst({
      where: {
        productVariantId: dto.productVariantId,
        warehouseId: dto.warehouseId,
      },
    });

    if (existing) {
      return {
        success: false,
        message: 'Inventory đã tồn tại cho variant này và warehouse',
      };
    }

    const inventory = await this.prisma.inventory.create({
      data: { ...dto },
    });

    return {
      success: true,
      message: 'Tạo inventory thành công',
      data: new InventoryResponseDto(inventory),
    };
  }

  async getInventories(productVariantId?: number, warehouseId?: number) {
    const where: any = {};

    if (productVariantId) where.productVariantId = productVariantId;
    if (warehouseId) where.warehouseId = warehouseId;

    const inventories = await this.prisma.inventory.findMany({
      where,
      include: {
        warehouse: true, // ← THÊM DÒNG NÀY để lấy thông tin warehouse
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      message: 'Lấy danh sách inventory thành công',
      data: inventories.map((i) => new InventoryResponseDto(i)),
    };
  }

  async getInventoryById(id: number) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id },
    });

    if (!inventory) {
      return {
        success: false,
        message: 'Inventory không tồn tại',
      };
    }

    return {
      success: true,
      message: 'Lấy inventory thành công',
      data: new InventoryResponseDto(inventory),
    };
  }

  async updateInventory(id: number, dto: UpdateInventoryDto) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id },
    });

    if (!inventory) {
      return {
        success: false,
        message: 'Inventory không tồn tại',
      };
    }

    const updated = await this.prisma.inventory.update({
      where: { id },
      data: { ...dto },
    });

    return {
      success: true,
      message: 'Cập nhật inventory thành công',
      data: new InventoryResponseDto(updated),
    };
  }

  async deleteInventory(id: number) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id },
    });

    if (!inventory) {
      return {
        success: false,
        message: 'Inventory không tồn tại',
      };
    }

    await this.prisma.inventory.delete({ where: { id } });

    return {
      success: true,
      message: 'Xóa inventory thành công',
    };
  }

async updateInventoryFromOrder(orderId: number) {
  // Logic cập nhật kho từ đơn hàng (cập nhật kho dựa trên trạng thái đơn hàng)
  const order = await this.prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true, // Lấy các OrderItem
    },
  });

  if (!order) {
    return {
      success: false,
      message: 'Không tìm thấy đơn hàng',
    };
  }

  const status = order.status;

  let inventoryUpdatePromises = order.items.map(async (item) => {
    const variant = item.productVariantId;
    const quantity = item.quantity;
    const warehouseId = item.warehouseId; // Sử dụng warehouseId đúng từ item

    // Kiểm tra xem warehouseId có null hay không
    if (!warehouseId) {
      return {
        success: false,
        message: 'Không có thông tin kho (warehouseId) cho sản phẩm',
      };
    }

    const inventory = await this.prisma.inventory.findFirst({
      where: {
        productVariantId: variant,
        warehouseId: warehouseId, // Dùng warehouseId đúng
      },
    });

    if (!inventory) {
      return {
        success: false,
        message: 'Không tìm thấy inventory cho variant này',
      };
    }

    if (['DRAFT', 'PAID_PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status)) {
      // Trừ kho
      await this.prisma.inventory.update({
        where: {
          id: inventory.id,
        },
        data: {
          qty: inventory.qty - quantity, // Trừ số lượng
        },
      });
    } else if (['CANCELLED', 'REFUNDED'].includes(status)) {
      // Cộng kho
      await this.prisma.inventory.update({
        where: {
          id: inventory.id,
        },
        data: {
          qty: inventory.qty + quantity, // Cộng thêm số lượng
        },
      });
    }

    return {
      success: true,
      message: `Cập nhật kho cho variant ${variant} thành công`,
    };
  });

  const results = await Promise.all(inventoryUpdatePromises);

  return {
    success: true,
    message: 'Cập nhật kho từ đơn hàng thành công',
    data: results,
  };
}
}
