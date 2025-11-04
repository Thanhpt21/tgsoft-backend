import { 
  Controller, Get, Post, Put, Delete, Body, Param, 
  ParseIntPipe, UseGuards, Query 
} from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { UpdatePromotionDto } from './dto/update-promption.dto';

@Controller('promotions')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('create_promotions')
  async create(@Body() dto: CreatePromotionDto) {
    return this.promotionService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('read_promotions')
  async getPromotions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
  ) {
    return this.promotionService.getPromotions(page, limit, search);
  }

  @Get('all/list')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('read_all_promotions')
  async getAll(@Query('search') search: string = '') {
    return this.promotionService.getAll(search);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('get_a_promotion')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.promotionService.getById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('update_promotions')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.promotionService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('delete_promotions')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.promotionService.delete(id);
  }
}
