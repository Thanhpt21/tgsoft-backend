import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactResponseDto } from './dto/contact-response.dto';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

@Injectable()
export class ContactService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
  ) {
    super(prisma, request);
  }

  async create(dto: CreateContactDto) {
    const contact = await this.prisma.contact.create({
      data: {
        ...dto,
        tenantId: this.tenantId,
      },
    });

    return {
      success: true,
      message: 'Tạo contact thành công',
      data: new ContactResponseDto(contact),
    };
  }

  async getContacts(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;
    const where: any = { tenantId: this.tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [contacts, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      success: true,
      message: 'Lấy danh sách contact thành công',
      data: {
        data: contacts.map((c) => new ContactResponseDto(c)),
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: number) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) return { success: false, message: 'Contact không tồn tại' };

    return {
      success: true,
      message: 'Lấy contact thành công',
      data: new ContactResponseDto(contact),
    };
  }

  async update(id: number, dto: UpdateContactDto) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) return { success: false, message: 'Contact không tồn tại' };

    const updated = await this.prisma.contact.update({
      where: { id },
      data: dto,
    });

    return {
      success: true,
      message: 'Cập nhật contact thành công',
      data: new ContactResponseDto(updated),
    };
  }

  async delete(id: number) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) return { success: false, message: 'Contact không tồn tại' };

    await this.prisma.contact.delete({ where: { id } });

    return { success: true, message: 'Xóa contact thành công' };
  }
}
