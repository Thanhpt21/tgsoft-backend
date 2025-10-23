import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('inventories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Permissions('create_inventories')
  async create(@Body() dto: CreateInventoryDto) {
    return this.inventoryService.create(dto);
  }


  @Get()
  @Permissions('read_inventories')
  async getAll(@Query('productVariantId') productVariantId?: number, @Query('warehouseId') warehouseId?: number) {
    return this.inventoryService.getInventories(productVariantId ? +productVariantId : undefined, warehouseId ? +warehouseId : undefined);
  }

  @Get(':id')
  @Permissions('get_a_inventories')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.getInventoryById(id);
  }

  @Put(':id')
  @Permissions('update_inventories')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInventoryDto) {
    return this.inventoryService.updateInventory(id, dto);
  }

  @Delete(':id')

  @Permissions('delete_inventories')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.deleteInventory(id);
  }

   @Post('update-from-order/:orderId')
    @Permissions('update_inventories_from_order')
    async updateFromOrder(@Param('orderId', ParseIntPipe) orderId: number) {
      return this.inventoryService.updateInventoryFromOrder(orderId);
    }
}
