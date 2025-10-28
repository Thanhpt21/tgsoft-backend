import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { slugify } from 'src/utils/slugify';
import { Prisma } from '@prisma/client';
import { UpdateTenantTierLimitsDto } from './dto/update-tenant-tier-limit';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  // ✅ Tạo tenant
  async create(dto: CreateTenantDto) {
    const slug = dto.slug || slugify(dto.name);

    // Check slug tồn tại
    const existing = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existing) throw new BadRequestException('Tenant slug đã tồn tại');

    const tenant = await this.prisma.tenant.create({ data: { ...dto, slug } });
    
    return {
      success: true,
      message: 'Tạo tenant thành công',
      data: tenant,
    };
  }

  // ✅ Lấy danh sách tenant với phân trang + tìm kiếm
  async getTenants(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;

    const where: Prisma.TenantWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { slug: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          ],
        }
      : {};

    const [tenants, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách tenant thành công',
      data: {
        data: tenants,
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // ✅ Lấy tất cả tenant (không phân trang)
  async getAllTenants(search = '') {
    const where: Prisma.TenantWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            { slug: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          ],
        }
      : {};

    const tenants = await this.prisma.tenant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      message: 'Lấy tất cả tenant thành công',
      data: tenants,
    };
  }

  // ✅ Lấy tenant theo id
  async getTenantById(id: number) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant không tồn tại');
    
    return {
      success: true,
      message: 'Lấy tenant thành công',
      data: tenant,
    };
  }

  // ✅ Cập nhật tenant
  async updateTenant(id: number, dto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant không tồn tại');

    const slug = dto.slug || (dto.name ? slugify(dto.name) : tenant.slug);

    const updated = await this.prisma.tenant.update({ 
      where: { id }, 
      data: { ...dto, slug } 
    });

    return {
      success: true,
      message: 'Cập nhật tenant thành công',
      data: updated,
    };
  }

  // ✅ Bật/tắt tenant
  async toggleStatus(id: number) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant không tồn tại');

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { isActive: !tenant.isActive },
    });

    return {
      success: true,
      message: `${updated.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} tenant thành công`,
      data: updated,
    };
  }

  // ✅ Xóa tenant
  async deleteTenant(id: number) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant không tồn tại');

    await this.prisma.tenant.delete({ where: { id } });
    
    return {
      success: true,
      message: 'Xóa tenant thành công',
      data: null,
    };
  }

  // ✅ Cập nhật giới hạn tier của tenant
  async updateTierLimits(id: number, dto: UpdateTenantTierLimitsDto) {
    // Kiểm tra tenant có tồn tại không
    const tenant = await this.prisma.tenant.findUnique({ 
      where: { id },
      select: {
        id: true,
        name: true,
        usedAccounts: true,
        usedSKUs: true,
        currentConcurrentUsers: true,
        expirationDate: true,
      }
    });

    if (!tenant) {
      throw new NotFoundException('Tenant không tồn tại');
    }

    // ✅ Validate: Giới hạn mới không được nhỏ hơn số đang sử dụng
    if (dto.maxAccounts !== undefined && dto.maxAccounts < tenant.usedAccounts) {
      throw new BadRequestException(
        `Giới hạn tài khoản (${dto.maxAccounts}) không thể nhỏ hơn số tài khoản đang sử dụng (${tenant.usedAccounts})`
      );
    }

    if (dto.maxSKUs !== undefined && dto.maxSKUs < tenant.usedSKUs) {
      throw new BadRequestException(
        `Giới hạn SKU (${dto.maxSKUs}) không thể nhỏ hơn số SKU đang sử dụng (${tenant.usedSKUs})`
      );
    }

    if (dto.maxConcurrentUsers !== undefined && dto.maxConcurrentUsers < tenant.currentConcurrentUsers) {
      throw new BadRequestException(
        `Giới hạn người dùng đồng thời (${dto.maxConcurrentUsers}) không thể nhỏ hơn số người đang truy cập (${tenant.currentConcurrentUsers})`
      );
    }

    // ✅ Cập nhật tier limits
    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.maxAccounts !== undefined && { maxAccounts: dto.maxAccounts }),
        ...(dto.maxSKUs !== undefined && { maxSKUs: dto.maxSKUs }),
        ...(dto.maxConcurrentUsers !== undefined && { maxConcurrentUsers: dto.maxConcurrentUsers }),
         ...(dto.expirationDate !== undefined && { expirationDate: dto.expirationDate }),
      },
    });

    return {
      success: true,
      message: 'Cập nhật giới hạn tenant thành công',
      data: updated,
    };
  }

  // ✅ (Optional) Method để lấy thông tin usage hiện tại
  // async getTenantUsage(id: number) {
  //   const tenant = await this.prisma.tenant.findUnique({
  //     where: { id },
  //     select: {
  //       id: true,
  //       name: true,
  //       usedAccounts: true,
  //       maxAccounts: true,
  //       usedSKUs: true,
  //       maxSKUs: true,
  //       currentConcurrentUsers: true,
  //       maxConcurrentUsers: true,
  //     },
  //   });

  //   if (!tenant) {
  //     throw new NotFoundException('Tenant không tồn tại');
  //   }

  //   return {
  //     success: true,
  //     message: 'Lấy thông tin sử dụng thành công',
  //     data: {
  //       ...tenant,
  //       accountsUsagePercent: Math.round((tenant.usedAccounts / tenant.maxAccounts) * 100),
  //       skusUsagePercent: Math.round((tenant.usedSKUs / tenant.maxSKUs) * 100),
  //       usersUsagePercent: Math.round((tenant.currentConcurrentUsers / tenant.maxConcurrentUsers) * 100),
  //     },
  //   };
  // }
}
