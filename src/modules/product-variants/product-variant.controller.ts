import { 
  Controller, Get, Post, Put, Delete, Body, Param, 
  ParseIntPipe, UseGuards, UseInterceptors, UploadedFile 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductVariantService } from './product-variant.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('product-variants')

export class ProductVariantController {
  constructor(private readonly service: ProductVariantService) {}

  @Post(':productId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('create_product_variants')
  @UseInterceptors(FileInterceptor('thumb')) // Thêm interceptor để nhận file
  async create(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: CreateProductVariantDto,
    @UploadedFile() thumb?: Express.Multer.File, // Nhận file upload
  ) {
    return this.service.create(productId, dto, thumb);
  }

  @Get(':productId')
  @Permissions('read_product_variants')
  async getByProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.service.getByProduct(productId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('update_product_variants')
  @UseInterceptors(FileInterceptor('thumb')) // Thêm interceptor cho update
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductVariantDto,
    @UploadedFile() thumb?: Express.Multer.File,
  ) {
    return this.service.update(id, dto, thumb);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('delete_product_variants')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
