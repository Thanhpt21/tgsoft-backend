import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { PromotionProductService } from './promotion-product.service';
import { CreatePromotionProductDto } from './dto/create-promotion-product.dto';
import { UpdatePromotionProductDto } from './dto/update-promotion-product.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('promotion-products')
export class PromotionProductController {
  constructor(private readonly promotionProductService: PromotionProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('create_promotion_products')
  async create(@Body() dto: CreatePromotionProductDto) {
    return this.promotionProductService.create(dto);
  }


  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('read_promotion_products')
  async getPromotionProducts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
  ) {
    return this.promotionProductService.getPromotionProducts(page, limit, search);
  }

 @Get('promotion/:promotionId')  // Thêm endpoint này
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('get_products_by_promotion')  // Tạo quyền truy cập mới nếu cần
  async getProductsByPromotionId(
    @Param('promotionId', ParseIntPipe) promotionId: number,  // Lấy promotionId từ URL
  ) {
    return this.promotionProductService.getProductsByPromotionId(promotionId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('get_a_promotion_product')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.promotionProductService.getById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('update_promotion_products')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromotionProductDto,
  ) {
    return this.promotionProductService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('delete_promotion_products')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.promotionProductService.delete(id);
  }
}
