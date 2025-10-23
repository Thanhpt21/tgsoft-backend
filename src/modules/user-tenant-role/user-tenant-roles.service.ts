import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserTenantRoleDto } from './dto/create-user-tenant-role.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';

@Injectable()
export class UserTenantRolesService {
  constructor(private prisma: PrismaService) {}

  async addRole(dto: CreateUserTenantRoleDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User không tồn tại');

    const tenant = await this.prisma.tenant.findUnique({ where: { id: dto.tenantId } });
    if (!tenant) throw new NotFoundException('Tenant không tồn tại');

    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) throw new NotFoundException('Role không tồn tại');

    // Kiểm tra xem người dùng đã có role trong tenant này chưa
    const existingRoleInTenant = await this.prisma.userTenantRole.findFirst({
      where: { userId: dto.userId, tenantId: dto.tenantId },
    });

    if (existingRoleInTenant) {
      throw new BadRequestException('Người dùng đã có vai trò trong cửa hàng này');
    }

    // Kiểm tra xem người dùng đã có role trong tenant khác và lấy thông tin tenant đó
    const userInOtherTenant = await this.prisma.userTenantRole.findFirst({
      where: { userId: dto.userId, tenantId: { not: dto.tenantId } },
      include: { tenant: true }, // Lấy thông tin tên của tenant
    });

    if (userInOtherTenant) {
      throw new BadRequestException(
        `Người dùng đã có role trong cửa hàng khác: ${userInOtherTenant.tenant.name}`
      );
    }

    const createdRole = await this.prisma.userTenantRole.create({ data: dto });

    return {
      success: true,
      message: 'Role đã được thêm thành công',
      data: createdRole,
    };
  }


  // Xóa role khỏi user trong tenant
  async removeRole(userId: number, tenantId: number, roleId: number) {
    const existing = await this.prisma.userTenantRole.findUnique({
      where: { userId_tenantId_roleId: { userId, tenantId, roleId } },
    });
    if (!existing) throw new NotFoundException('User chưa có role này trong tenant');

    // Xóa role
    await this.prisma.userTenantRole.delete({
      where: { userId_tenantId_roleId: { userId, tenantId, roleId } },
    });

    return {
      success: true,
      message: 'Role đã được xóa thành công khỏi user trong tenant',
      data: null,
    };
  }

  // Lấy danh sách roles của user trong tenant
  async getRolesOfUserInTenant(userId: number, tenantId: number) {
    const roles = await this.prisma.userTenantRole.findMany({
      where: { userId, tenantId },
      include: { role: true },
    });

    return {
      success: true,
      message: 'Lấy danh sách roles thành công',
      data: roles.map((r) => r.role),
    };
  }

  // Lấy danh sách users trong tenant
  async getUsersOfTenant(tenantId: number) {
    const users = await this.prisma.userTenantRole.findMany({
      where: { tenantId },
      include: { user: true, role: true },
    });

    const userList = users.map((u) => ({
      user: new UserResponseDto(u.user),
      role: u.role,
    }));

    return {
      success: true,
      message: 'Lấy danh sách người dùng trong tenant thành công',
      data: userList,
    };
  }
}
