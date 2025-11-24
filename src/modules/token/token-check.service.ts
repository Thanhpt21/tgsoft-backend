// src/token/token-check.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class TokenCheckService {
  private readonly logger = new Logger(TokenCheckService.name);

  constructor(private prisma: PrismaService) {}

  // Kiểm tra mỗi giờ
  @Cron(CronExpression.EVERY_HOUR)
  async checkAndTransferFixedTokens() {
    this.logger.log('🔄 Kiểm tra và chuyển fixedTokens nếu cần...');

    try {
      const adminUsers = await this.prisma.user.findMany({
        where: {
          role: 'adminshop',
          tokenAI: { lte: 0 }, // Chỉ admin users đã hết tokenAI
          fixedTokens: { gt: 0 } // Và còn fixedTokens
        },
        select: {
          id: true,
          name: true,
          email: true,
          tokenAI: true,
          fixedTokens: true,
          tenantId: true,
          tenant: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      for (const user of adminUsers) {
        try {
          // Chuyển toàn bộ fixedTokens sang tokenAI
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              tokenAI: user.fixedTokens, // fixedTokens → tokenAI
              fixedTokens: 0 // fixedTokens = 0 (bị trừ)
            }
          });

          // Ghi log
          await this.prisma.auditLog.create({
            data: {
              action: 'FIXED_TOKENS_TRANSFER',
              resource: 'USER',
              resourceId: user.id,
              method: 'AUTO',
              route: '/token/auto-transfer',
              userId: user.id,
              payload: {
                tenantId: user.tenantId,
                tenantName: user.tenant?.name,
                oldTokenAI: user.tokenAI,
                newTokenAI: user.fixedTokens,
                transferredFixedTokens: user.fixedTokens,
                transferredAt: new Date().toISOString()
              }
            }
          });

          this.logger.log(`✅ Đã chuyển ${user.fixedTokens} fixedTokens sang tokenAI cho admin user ${user.name} (tenant: ${user.tenant?.name})`);
        } catch (error) {
          this.logger.error(`❌ Lỗi chuyển fixedTokens cho admin user ${user.name}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('❌ Lỗi hệ thống khi kiểm tra token:', error);
    }
  }

  // Hàm real-time (gọi khi sử dụng AI)
  async checkAndTransferForUser(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        role: 'adminshop',
        tokenAI: { lte: 0 },
        fixedTokens: { gt: 0 }
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (user) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          tokenAI: user.fixedTokens,
          fixedTokens: 0
        }
      });

      // Ghi log cho real-time transfer
      await this.prisma.auditLog.create({
        data: {
          action: 'FIXED_TOKENS_TRANSFER_REALTIME',
          resource: 'USER',
          resourceId: user.id,
          method: 'AUTO',
          route: '/token/auto-transfer',
          userId: user.id,
          payload: {
            tenantId: user.tenantId,
            tenantName: user.tenant?.name,
            transferredFixedTokens: user.fixedTokens,
            transferredAt: new Date().toISOString()
          }
        }
      });

      this.logger.log(`✅ Real-time: Đã chuyển ${user.fixedTokens} fixedTokens sang tokenAI cho admin user ${user.name} (tenant: ${user.tenant?.name})`);
    }
  }
}