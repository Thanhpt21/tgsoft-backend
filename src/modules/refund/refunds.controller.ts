// src/refunds/refunds.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { RefundsService } from './refunds.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import { UpdateRefundDto } from './dto/update-refund.dto';
// Import Guard nếu bạn đang sử dụng bảo mật
// import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('refunds')
// @UseGuards(JwtAuthGuard) // Áp dụng bảo mật cho toàn bộ controller
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post()
  create(@Body() createRefundDto: CreateRefundDto) {
    return this.refundsService.create(createRefundDto);
  }

  @Get()
  getRefunds(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('paymentId', new ParseIntPipe({ optional: true })) paymentId?: number,
    @Query('status') status?: string,
  ) {
    return this.refundsService.getRefunds(page, limit, paymentId, status);
  }

  @Get(':id')
  getRefundById(@Param('id', ParseIntPipe) id: number) {
    return this.refundsService.getRefundById(id);
  }

  @Put(':id')
  updateRefund(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRefundDto: UpdateRefundDto,
  ) {
    return this.refundsService.updateRefund(id, updateRefundDto);
  }

  @Delete(':id')
  deleteRefund(@Param('id', ParseIntPipe) id: number) {
    return this.refundsService.deleteRefund(id);
  }
}