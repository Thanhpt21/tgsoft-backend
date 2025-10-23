// src/common/middlewares/tenant.middleware.ts
import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    let tenantId: number | undefined;

    // 1️⃣ JWT claim
    const user = req.user as any;
    if (user?.tenantId) {
      tenantId = Number(user.tenantId);
    }

    // 2️⃣ Header x-tenant-id (override nếu có)
    if (req.headers['x-tenant-id']) {
      tenantId = Number(req.headers['x-tenant-id']);
    }

    // 3️⃣ Subdomain
    if (!tenantId && req.headers.host) {
      const subdomain = req.headers.host.split('.')[0];
      if (subdomain) {
        const tenant = await this.prisma.tenant.findUnique({ where: { slug: subdomain } });
        if (tenant) tenantId = tenant.id;
      }
    }

    if (!tenantId) {
      return next(); // Không throw, guard sẽ xử lý tenant bắt buộc
    }

    req['tenantId'] = tenantId;
    next();
  }
}
