import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto';
import { UpdateFinancialTransactionDto } from './dto/update-financial-transaction.dto';
import { FinancialTransactionResponseDto } from './dto/financial-transaction-response.dto';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import { REQUEST } from '@nestjs/core';

@Injectable()
export class FinancialTransactionService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
  ) {
    super(prisma, request);
  }

  async create(dto: CreateFinancialTransactionDto) {
    const financialTransaction = await this.prisma.financialTransaction.create({
      data: {
        tenantId: this.tenantId,
        orderId: dto.orderId,
        payoutId: dto.payoutId,
        commissionId: dto.commissionId,
        receiverType: dto.receiverType,
        userId: dto.userId,
        type: dto.type,
        amount: dto.amount,
        currency: dto.currency ?? 'VND',
        reference: dto.reference,
        description: dto.description,
      },
    });

    return {
      success: true,
      message: 'Tạo giao dịch tài chính thành công',
      data: new FinancialTransactionResponseDto(financialTransaction),
    };
  }

  async update(id: number, dto: UpdateFinancialTransactionDto) {
    const financialTransaction = await this.prisma.financialTransaction.findUnique({
      where: { id },
    });

    if (!financialTransaction) {
      return { success: false, message: 'Giao dịch tài chính không tồn tại' };
    }

    const updatedFinancialTransaction = await this.prisma.financialTransaction.update({
      where: { id },
      data: dto,
    });

    return {
      success: true,
      message: 'Cập nhật giao dịch tài chính thành công',
      data: new FinancialTransactionResponseDto(updatedFinancialTransaction),
    };
  }

  async getById(id: number) {
    const financialTransaction = await this.prisma.financialTransaction.findUnique({
      where: { id },
    });

    if (!financialTransaction) {
      return { success: false, message: 'Giao dịch tài chính không tồn tại' };
    }

    return {
      success: true,
      message: 'Lấy giao dịch tài chính thành công',
      data: new FinancialTransactionResponseDto(financialTransaction),
    };
  }

  async getAll(filters?: { 
    userId?: number; 
    type?: string; 
    orderId?: number;
    payoutId?: number;
    commissionId?: number;
  }) {
    const where: any = {
      tenantId: this.tenantId,
    };

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.type) where.type = filters.type;
    if (filters?.orderId) where.orderId = filters.orderId;
    if (filters?.payoutId) where.payoutId = filters.payoutId;
    if (filters?.commissionId) where.commissionId = filters.commissionId;

    const financialTransactions = await this.prisma.financialTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      message: 'Lấy danh sách giao dịch tài chính thành công',
      data: financialTransactions.map((ft) => new FinancialTransactionResponseDto(ft)),
    };
  }

  async delete(id: number) {
    const financialTransaction = await this.prisma.financialTransaction.findUnique({
      where: { id },
    });

    if (!financialTransaction) {
      return { success: false, message: 'Giao dịch tài chính không tồn tại' };
    }

    await this.prisma.financialTransaction.delete({ where: { id } });

    return { success: true, message: 'Xóa giao dịch tài chính thành công' };
  }
}