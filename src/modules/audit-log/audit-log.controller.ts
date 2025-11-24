import { Controller, Get, Query, Param } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('tenantId') tenantId?: number,
    @Query('tokenActionsOnly') tokenActionsOnly?: string, // Đổi thành string
    @Query('userId') userId?: number,
    @Query('action') action?: string | string[]
  ) {
    return this.auditLogService.findAll(
      +page,
      +limit,
      search,
      tenantId ? +tenantId : undefined,
      tokenActionsOnly === 'true', // So sánh string với string
      userId ? +userId : undefined,
      action
    );
  }

  // API mới: Chỉ lấy lịch sử token
  @Get('token-history')
  async findTokenHistory(
    @Query('userId') userId?: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.auditLogService.findTokenHistory(
      userId ? +userId : undefined,
      +page,
      +limit
    );
  }

  @Get('formatted')
  async getFormattedLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('tokenActionsOnly') tokenActionsOnly?: string, // Đổi thành string
    @Query('userId') userId?: number
  ) {
    const result = await this.auditLogService.getFormattedLogs(
      page ? +page : undefined,
      limit ? +limit : undefined,
      tokenActionsOnly === 'true', // So sánh string với string
      userId ? +userId : undefined
    );
    return {
      success: true,
      message: 'Lấy formatted logs thành công',
      data: result
    };
  }

  // API mới: Chỉ lấy formatted token history
  @Get('formatted/token-history')
  async getFormattedTokenHistory(
    @Query('userId') userId?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const result = await this.auditLogService.getFormattedTokenHistory(
      userId ? +userId : undefined,
      page ? +page : undefined,
      limit ? +limit : undefined
    );
    return {
      success: true,
      message: 'Lấy formatted token history thành công',
      data: result
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.auditLogService.findOne(+id);
  }
}