// src/token/token.controller.ts
import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { TokenRenewService } from './token-renew.service';
import { TokenCheckService } from './token-check.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TokenController {
  constructor(
    private readonly tokenRenewService: TokenRenewService,
    private readonly tokenCheckService: TokenCheckService,
  ) {}

  @Post('renew/manual')
  async manualRenew() {
    await this.tokenRenewService.handleTokenRenewal();
    return {
      success: true,
      message: 'Đã chạy manual renew token thành công'
    };
  }

  @Get('renew/preview')
  async previewRenew() {
    return await this.tokenRenewService.previewRenewTokens();
  }

  @Post('check/manual')
  async manualCheck() {
    await this.tokenCheckService.checkAndTransferFixedTokens();
    return {
      success: true,
      message: 'Đã chạy manual check token thành công'
    };
  }
}