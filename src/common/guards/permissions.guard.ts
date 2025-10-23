// src/common/guards/permissions.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Lấy danh sách permission yêu cầu từ decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu không có permission yêu cầu → cho phép luôn
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user; // JwtAuthGuard attach user
    const tenantId = request.tenantId; // Middleware attach tenantId từ header/subdomain

    // Admin toàn cục bỏ qua tenant + permission check
    if (user.role === 'admin') return true;

    // User bình thường phải có tenant
    if (!tenantId) throw new ForbiddenException('Tenant not specified');

    // Lấy tất cả role của user trong tenant
    const userTenantRoles = await this.prisma.userTenantRole.findMany({
      where: { userId: user.id, tenantId: Number(tenantId) },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
      },
    });

    // Nếu user không có role nào trong tenant → Forbidden
    if (!userTenantRoles.length)
      throw new ForbiddenException('Bạn không có quyền thực hiện hành động này');

    // Lấy tất cả permission của user
    const userPermissions = new Set<string>();
    for (const utr of userTenantRoles) {
      for (const rp of utr.role.rolePermissions) {
        userPermissions.add(rp.permission.name);
      }
    }

    // Check tất cả permission yêu cầu
    const hasPermission = requiredPermissions.every(p => userPermissions.has(p));
    if (!hasPermission)
      throw new ForbiddenException('Bạn không có quyền thực hiện hành động này');

    return true;
  }
}
