import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)

  async create(@Body() dto: CreateOrderDto, @Req() req) {
    const userId = req.user.id; // 👈 lấy từ JWT
    return this.ordersService.create(userId, dto);
  }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions('read_orders')
    async getAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('userId') userId?: number,
    @Query('status') status?: string,
    @Query('search') search: string = '',
    ) {
        return this.ordersService.getOrders(+page, +limit, userId ? +userId : undefined, status, search);
    }

    // Lấy đơn hàng của một người dùng
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getOrdersByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.ordersService.getOrdersByUser(userId, page, limit);
  }

 @Get('check-purchase/:productId')
  @UseGuards(JwtAuthGuard)
  async checkUserPurchasedProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Req() req: any,
  ) {
    return this.ordersService.checkUserPurchasedProduct(productId, req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getOrderById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('update_orders')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderDto) {
    return this.ordersService.updateOrder(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('delete_orders')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.deleteOrder(id);
  }
}
