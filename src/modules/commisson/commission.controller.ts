// src/modules/commission/commission.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('commissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Post()
  @Permissions('create_commissions') 
  async create(@Body() dto: CreateCommissionDto) {
    return this.commissionService.create(dto);
  }

  @Get()
  @Permissions('read_commissions')  
  async getAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('orderId') orderId?: number,
    @Query('search') search: string = '',
  ) {
    return this.commissionService.getCommissions(page, limit, orderId, search);
  }

  @Get(':id')
  @Permissions('get_a_commission') 
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.commissionService.getCommissionById(id);
  }

  @Put(':id')
  @Permissions('update_commissions') 
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCommissionDto) {
    return this.commissionService.updateCommission(id, dto);
  }

  @Delete(':id')
  @Permissions('delete_commissions')  
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.commissionService.deleteCommission(id);
  }
}
