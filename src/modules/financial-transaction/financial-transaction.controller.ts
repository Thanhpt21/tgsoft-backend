import { Body, Controller, Param, Put, Post, Get, Delete, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { FinancialTransactionService } from './financial-transaction.service';
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto';
import { UpdateFinancialTransactionDto } from './dto/update-financial-transaction.dto';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';

@Controller('financial-transactions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinancialTransactionController {
  constructor(private readonly financialTransactionService: FinancialTransactionService) {}

  @Post()
  @Permissions('create_financial_transaction')
  async create(@Body() dto: CreateFinancialTransactionDto) {
    return this.financialTransactionService.create(dto);
  }

@Get()
  @Permissions('view_all_financial_transaction')
  async getAll(
    @Query('userId') userId?: string,
    @Query('type') type?: string,
    @Query('orderId') orderId?: string,
    @Query('payoutId') payoutId?: string,
    @Query('commissionId') commissionId?: string,
  ) {
    return this.financialTransactionService.getAll({
      userId: userId ? +userId : undefined,
      type,
      orderId: orderId ? +orderId : undefined,
      payoutId: payoutId ? +payoutId : undefined,
      commissionId: commissionId ? +commissionId : undefined,
    });
  }
  
  @Get(':id')
  @Permissions('view_financial_transaction')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.financialTransactionService.getById(id);
  }

  @Put(':id')
  @Permissions('update_financial_transaction')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFinancialTransactionDto) {
    return this.financialTransactionService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('delete_financial_transaction')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.financialTransactionService.delete(id);
  }
}