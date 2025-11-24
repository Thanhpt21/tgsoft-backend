import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { CreateSupportMailboxDto } from './dto/create-support-mailbox.dto';
import { UpdateSupportMailboxDto } from './dto/update-support-mailbox.dto';
import { AdminReplyDto } from './dto/admin-reply.dto';
import { SupportMailboxResponseDto } from './dto/support-mailbox-response.dto';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { SupportStatus } from '@prisma/client';

@Injectable()
export class SupportMailboxService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
  ) {
    super(prisma, request);
  }

  async create(dto: CreateSupportMailboxDto) {
    const supportMailbox = await this.prisma.supportMailbox.create({
      data: {
        ...dto,
        createdBy: this.request.user.id, // Lấy từ user đang đăng nhập
        tenantId: this.tenantId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Tạo support mailbox thành công',
      data: new SupportMailboxResponseDto(supportMailbox),
    };
  }

  async getSupportMailboxes(page = 1, limit = 10, search = '', status?: string) {
    const skip = (page - 1) * limit;
      const userRole = this.request.user?.role;
      let where: any = {};

      if (userRole === 'admin') {
        // Admin có thể xem tất cả support tickets
        where = {};
      } else {
        // Non-admin chỉ xem tenant của mình
        where = { tenantId: this.tenantId };
      }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          creator: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    if (status && Object.values(SupportStatus).includes(status as SupportStatus)) {
      where.status = status;
    }

    const [supportMailboxes, total] = await this.prisma.$transaction([
      this.prisma.supportMailbox.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          replier: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
           tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.supportMailbox.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách support mailbox thành công',
      data: {
        data: supportMailboxes.map((item) => new SupportMailboxResponseDto(item)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number) {
    const supportMailbox = await this.prisma.supportMailbox.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!supportMailbox) {
      return { success: false, message: 'Support mailbox không tồn tại' };
    }

    return {
      success: true,
      message: 'Lấy support mailbox thành công',
      data: new SupportMailboxResponseDto(supportMailbox),
    };
  }

  async update(id: number, dto: UpdateSupportMailboxDto) {
    const supportMailbox = await this.prisma.supportMailbox.findUnique({ where: { id } });
    if (!supportMailbox) {
      return { success: false, message: 'Support mailbox không tồn tại' };
    }

    // Nếu có shopReply, cập nhật shopRepliedAt
    const updateData: any = { ...dto };
    if (dto.shopReply && !supportMailbox.shopRepliedAt) {
      updateData.shopRepliedAt = new Date();
    }

    const updated = await this.prisma.supportMailbox.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Cập nhật support mailbox thành công',
      data: new SupportMailboxResponseDto(updated),
    };
  }

  async adminReply(id: number, dto: AdminReplyDto) {
    const supportMailbox = await this.prisma.supportMailbox.findUnique({ where: { id } });
    if (!supportMailbox) {
      return { success: false, message: 'Support mailbox không tồn tại' };
    }

    const updated = await this.prisma.supportMailbox.update({
      where: { id },
      data: {
        adminReply: dto.adminReply,
        repliedAt: new Date(),
        repliedBy: this.request.user.id, // Lấy từ admin đang đăng nhập
        status: dto.status || supportMailbox.status,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Phản hồi admin đã được gửi',
      data: new SupportMailboxResponseDto(updated),
    };
  }

  async delete(id: number) {
    const supportMailbox = await this.prisma.supportMailbox.findUnique({ where: { id } });
    if (!supportMailbox) {
      return { success: false, message: 'Support mailbox không tồn tại' };
    }

    await this.prisma.supportMailbox.delete({ where: { id } });

    return { success: true, message: 'Xóa support mailbox thành công' };
  }
}