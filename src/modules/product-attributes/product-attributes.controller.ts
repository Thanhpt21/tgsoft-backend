import { Controller, Post, Delete, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ProductAttributesService } from './product-attributes.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('product-attributes')
export class ProductAttributesController {
  constructor(private readonly service: ProductAttributesService) {}

  @Post(':productId/:attributeId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('assign_product_attributes')
  async assign(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('attributeId', ParseIntPipe) attributeId: number,
  ) {
    return this.service.assign(productId, attributeId);
  }

  @Get(':productId')
  @Permissions('read_product_attributes')
  async getByProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.service.getByProduct(productId);
  }

  @Delete(':productId/:attributeId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('remove_product_attributes')
  async remove(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('attributeId', ParseIntPipe) attributeId: number,
  ) {
    return this.service.remove(productId, attributeId);
  }
}
