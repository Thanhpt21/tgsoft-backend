import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { AuditLog, Prisma } from '@prisma/client';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { formatAuditLogs } from 'src/interfaces/audit-log-entry';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: dto,
    });
  }

  async findAll(
    page = 1,
    limit = 10,
    search?: string,
    tenantId?: number,
    // Thêm params mới để filter token actions
    tokenActionsOnly?: boolean,
    userId?: number,
    action?: string | string[]
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { action: { contains: search, mode: 'insensitive' } },
                { route: { contains: search, mode: 'insensitive' } },
                { method: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        // Filter chỉ các action token nếu được yêu cầu
        tokenActionsOnly
          ? {
              action: {
                in: [
                  'MONTHLY_TOKEN_RENEW',
                  'FIXED_TOKENS_TRANSFER', 
                  'FIXED_TOKENS_TRANSFER_REALTIME',
                  'TOKEN_PURCHASE',
                  'TOKEN_UPDATE'
                ]
              }
            }
          : {},
        // Filter theo userId nếu có
        userId ? { userId } : {},
        // Filter theo action cụ thể nếu có
        action 
          ? { 
              action: Array.isArray(action) 
                ? { in: action } 
                : { equals: action } 
            } 
          : {},
      ],
    };

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách audit log thành công',
      data: {
        data: logs.map((log) => new AuditLogResponseDto(log)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  // Hàm mới: Chỉ lấy lịch sử token
  async findTokenHistory(
    userId?: number,
    page = 1,
    limit = 10
  ) {
    return this.findAll(
      page,
      limit,
      undefined, // search
      undefined, // tenantId
      true,      // tokenActionsOnly
      userId     // userId
    );
  }

  async findOne(id: number) {
    const log = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!log) {
      return { success: false, message: 'Audit log không tồn tại' };
    }
    return {
      success: true,
      message: 'Lấy audit log thành công',
      data: new AuditLogResponseDto(log),
    };
  }

  async getFormattedLogs(
    page?: number, 
    limit?: number,
    tokenActionsOnly?: boolean,
    userId?: number
  ) {
    const where: Prisma.AuditLogWhereInput = {
      // Filter chỉ token actions nếu được yêu cầu
      ...(tokenActionsOnly && {
        action: {
          in: [
            'MONTHLY_TOKEN_RENEW',
            'FIXED_TOKENS_TRANSFER',
            'FIXED_TOKENS_TRANSFER_REALTIME',
            'TOKEN_PURCHASE',
            'TOKEN_UPDATE'
          ]
        }
      }),
      // Filter theo userId nếu có
      ...(userId && { userId })
    };

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: page && limit ? (page - 1) * limit : undefined,
      take: limit,
      include: {
        user: true,
      },
    });

    // Map sang AuditLogEntry với userId
    const entries = logs.map(log => ({
      id: log.id,
      userId: log.user?.id ?? null,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      method: log.method ?? undefined,
      route: log.route ?? undefined,
      payload: log.payload && typeof log.payload === 'object' ? (log.payload as Record<string, any>) : null,
      createdAt: log.createdAt.toISOString(),
    }));

    return formatAuditLogs(entries);
  }

  // Hàm mới: Lấy formatted token history
  async getFormattedTokenHistory(userId?: number, page?: number, limit?: number) {
    return this.getFormattedLogs(page, limit, true, userId);
  }
}