// src/token/token-renew.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class TokenRenewService {
  private readonly logger = new Logger(TokenRenewService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleTokenRenewal() {
    this.logger.log('🔄 Bắt đầu renew token đầu tháng...');

    try {
      const adminUsers = await this.prisma.user.findMany({
        where: {
          role: 'adminshop'
        },
        select: {
          id: true,
          name: true,
          email: true,
          tokenAI: true,
          defaultTokens: true,
          fixedTokens: true, // fixedTokens giữ nguyên
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
          // CÔNG THỨC ĐƠN GIẢN: tokenAI mới = defaultTokens
          const newTokenAI = user.defaultTokens;

          await this.prisma.user.update({
            where: { id: user.id },
            data: { 
              tokenAI: newTokenAI 
              // fixedTokens KHÔNG thay đổi
            }
          });

          // Ghi log - SỬA THEO ĐÚNG SCHEMA AUDITLOG
          await this.prisma.auditLog.create({
            data: {
              action: 'MONTHLY_TOKEN_RENEW',
              resource: 'USER',
              resourceId: user.id,
              method: 'AUTO',
              route: '/token/monthly-renew',   
              userId: user.id,
              payload: {
                tenantId: user.tenantId,
                tenantName: user.tenant?.name,
                oldTokenAI: user.tokenAI,
                newTokenAI: newTokenAI,
                defaultTokens: user.defaultTokens,
                fixedTokens: user.fixedTokens, // fixedTokens giữ nguyên
                renewedAt: new Date().toISOString()
              }
            }
          });

          this.logger.log(`✅ Đã renew token cho admin user ${user.name} (tenant: ${user.tenant?.name}): ${user.tokenAI} → ${newTokenAI} (fixedTokens: ${user.fixedTokens})`);
        } catch (error) {
          this.logger.error(`❌ Lỗi renew token cho admin user ${user.name}:`, error);
        }
      }

      this.logger.log('🎉 Hoàn thành renew token đầu tháng');

    } catch (error) {
      this.logger.error('❌ Lỗi hệ thống khi renew token:', error);
    }
  }

  // Hàm preview renew
  async previewRenewTokens() {
    const adminUsers = await this.prisma.user.findMany({
      where: {
        role: 'adminshop'
      },
      select: {
        id: true,
        name: true,
        email: true,
        tokenAI: true,
        defaultTokens: true,
        fixedTokens: true,
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const preview = adminUsers.map(user => {
      const newTokenAI = user.defaultTokens;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantName: user.tenant?.name,
        currentTokenAI: user.tokenAI,
        defaultTokens: user.defaultTokens,
        fixedTokens: user.fixedTokens,
        newTokenAI: newTokenAI,
        change: newTokenAI - user.tokenAI
      };
    });

    return {
      success: true,
      message: 'Preview renew token',
      data: preview
    };
  }
}