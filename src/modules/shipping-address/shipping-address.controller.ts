import { 
  Controller, Get, Post, Put, Delete, Body, Param, 
  ParseIntPipe, UseGuards, Query, 
  Req,
  BadRequestException
} from '@nestjs/common';
import { CreateShippingAddressDto } from './dto/create-shipping-address.dto';
import { UpdateShippingAddressDto } from './dto/update-shipping-address.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { ShippingAddressService } from './shipping-address.service';

@Controller('shipping-addresses')
export class ShippingAddressController {
  constructor(private readonly service: ShippingAddressService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @Permissions('create_shipping_addresses')
  async create(
    @Body() dto: CreateShippingAddressDto,
    @Req() req
  ) {
     const userId = req.user.id;
    return this.service.create(dto, userId);
  }

  @Get()
  @Permissions('read_shipping_addresses')
  async getShippingAddresses(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
  ) {
    return this.service.getShippingAddresses(page, limit, search);
  }

  @Get('all/list')
  @Permissions('read_all_shipping_addresses')
  async getAll(@Query('search') search: string = '') {
    return this.service.getAllShippingAddresses(search);
  }

  @UseGuards(JwtAuthGuard)
    @Get('user/:userId')
    @Permissions('read_shipping_addresses')
    async getShippingAddressesByUserId(
      @Param('userId') userId: string, 
    ) {
      const userIdNumber = parseInt(userId, 10);
      if (isNaN(userIdNumber)) {
        throw new BadRequestException('Invalid userId');
      }

      return this.service.getShippingAddressesByUserId(userIdNumber);
    }

  @Get(':id')
  @Permissions('get_a_shipping_address')
  async getShippingAddressById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getShippingAddressById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Permissions('update_shipping_addresses')
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() dto: UpdateShippingAddressDto
  ) {
    return this.service.updateShippingAddress(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Permissions('delete_shipping_addresses')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteShippingAddress(id);
  }

  @Put('set-default/:userId/:addressId')
  @UseGuards(JwtAuthGuard)
  @Permissions('update_shipping_addresses')
  async setDefaultShippingAddress(
    @Param('userId') userId: string,
    @Param('addressId') addressId: string,
  ) {
    const userIdNumber = parseInt(userId, 10);
    const addressIdNumber = parseInt(addressId, 10);

    if (isNaN(userIdNumber) || isNaN(addressIdNumber)) {
      throw new BadRequestException('Invalid userId or addressId');
    }

    return this.service.setDefaultShippingAddress(userIdNumber, addressIdNumber);
  }
}
