import { 
  Controller, Get, Post, Put, Delete, Body, Param, 
  ParseIntPipe, UseGuards, Query 
} from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('warehouses')

export class WarehouseController {
  constructor(private readonly service: WarehouseService) {}
@UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post()
  @Permissions('create_warehouses')
  async create(@Body() dto: CreateWarehouseDto) {
    return this.service.create(dto);
  }

  // Lấy danh sách phân trang + search
  @Get()
  @Permissions('read_warehouses')
  async getWarehouses(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
  ) {
    return this.service.getWarehouses(page, limit, search);
  }

  // Lấy tất cả không phân trang
  @Get('all/list')
  @Permissions('read_all_warehouses')
  async getAll(@Query('search') search: string = '') {
    return this.service.getAllWarehouses(search);
  }

  @Get(':id')
  @Permissions('get_a_warehouse')
  async getWarehouseById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getWarehouseById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('update_warehouses')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWarehouseDto) {
    return this.service.updateWarehouse(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('delete_warehouses')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteWarehouse(id);
  }
}
