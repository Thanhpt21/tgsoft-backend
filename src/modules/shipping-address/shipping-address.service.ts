import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { CreateShippingAddressDto } from './dto/create-shipping-address.dto';
import { UpdateShippingAddressDto } from './dto/update-shipping-address.dto';
import { ShippingAddressResponseDto } from './dto/shipping-address-response.dto';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { Prisma } from '@prisma/client';

@Injectable()
export class ShippingAddressService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
  ) {
    super(prisma, request);
  }

  async create(dto: CreateShippingAddressDto,  userId: number) {
    const existing = await this.prisma.shippingAddress.findFirst({
      where: { phone: dto.phone, tenantId: this.tenantId },
    });
    if (existing) return { success: false, message: 'Địa chỉ đã tồn tại trong tenant' };

    const address = await this.prisma.shippingAddress.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
        note: dto.note ?? null,
        province_id: dto.province_id,
        province: dto.province,
        district_id: dto.district_id,
        district: dto.district,
        ward_id: dto.ward_id,
        ward: dto.ward,
        tenantId: this.tenantId,
        is_default: dto.is_default ?? false,
        userId: userId,
      },
    });

    return { success: true, message: 'Tạo địa chỉ giao hàng thành công', data: new ShippingAddressResponseDto(address) };
  }

  async getShippingAddresses(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;

    const where: any = { tenantId: this.tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [addresses, total] = await this.prisma.$transaction([
      this.prisma.shippingAddress.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.shippingAddress.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách địa chỉ giao hàng thành công',
      data: {
        data: addresses.map((a) => new ShippingAddressResponseDto(a)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async getAllShippingAddresses(search?: string) {
    const where: any = { tenantId: this.tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const addresses = await this.prisma.shippingAddress.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      message: 'Lấy tất cả địa chỉ giao hàng thành công',
      data: addresses.map((a) => new ShippingAddressResponseDto(a)),
    };
  }

  async getShippingAddressById(id: number) {
    const address = await this.prisma.shippingAddress.findFirst({
      where: { id, tenantId: this.tenantId },
    });

    if (!address) return { success: false, message: 'Địa chỉ không tồn tại trong tenant' };

    return { success: true, message: 'Lấy địa chỉ giao hàng thành công', data: new ShippingAddressResponseDto(address) };
  }

  async updateShippingAddress(id: number, dto: UpdateShippingAddressDto) {
    const address = await this.prisma.shippingAddress.findFirst({
      where: { id, tenantId: this.tenantId },
    });

    if (!address) return { success: false, message: 'Địa chỉ không tồn tại trong tenant' };

    const updated = await this.prisma.shippingAddress.update({
      where: { id },
      data: { ...dto },
    });

    return { success: true, message: 'Cập nhật địa chỉ giao hàng thành công', data: new ShippingAddressResponseDto(updated) };
  }

  async deleteShippingAddress(id: number) {
    const address = await this.prisma.shippingAddress.findFirst({
      where: { id, tenantId: this.tenantId },
    });

    if (!address) return { success: false, message: 'Địa chỉ không tồn tại trong tenant' };

    await this.prisma.shippingAddress.delete({ where: { id } });

    return { success: true, message: 'Xóa địa chỉ giao hàng thành công' };
  }

  async getShippingAddressesByUserId(userId: number) {
    const where: any = { tenantId: this.tenantId, userId }; // Điều kiện theo userId

    const addresses = await this.prisma.shippingAddress.findMany({
      where,
      orderBy: { createdAt: 'desc' }, // Sắp xếp theo thời gian tạo
    });

    return {
      success: true,
      message: 'Lấy tất cả địa chỉ giao hàng theo userId thành công',
      data: addresses.map((a) => new ShippingAddressResponseDto(a)),
    };
  }

    async setDefaultShippingAddress(userId: number, addressId: number) {
    const result = await this.prisma.$transaction(async (prisma) => {
      await prisma.shippingAddress.updateMany({
        where: {
          userId,
          tenantId: this.tenantId,
          is_default: true, 
        },
        data: {
          is_default: false, 
        },
      });

      const address = await prisma.shippingAddress.update({
        where: { id: addressId },
        data: { is_default: true },
      });

      return address;
    });

    return {
      success: true,
      message: 'Địa chỉ mặc định đã được cập nhật thành công',
      data: new ShippingAddressResponseDto(result), 
    };
  }
}
