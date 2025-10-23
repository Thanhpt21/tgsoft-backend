import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('products')

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('create_products')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumb', maxCount: 1 },
      { name: 'images', maxCount: 10 },
    ]),
  )
  async createProduct(
    @Body() dto: CreateProductDto,
    @UploadedFiles() files: { thumb?: Express.Multer.File[], images?: Express.Multer.File[] },
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    const thumb = files.thumb?.[0];
    const images = files.images || [];
    return this.productService.create(dto, userId, thumb, images);
  }

  @Get()
  async getProducts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
  ) {
    return this.productService.getProducts(+page, +limit, search);
  }

  @Get('slug/:slug')
  async getProductBySlug(@Param('slug') slug: string) {
    return this.productService.getProductBySlug(slug);
  }

  @Get('all/list/:tenantId')
  async getAllProducts(
    @Param('tenantId') tenantId: number, // Lấy tenantId từ tham số URL
    @Query('search') search: string = '', // Tham số tìm kiếm (mặc định là rỗng)
  ) {
    return this.productService.getAllProductsWithSearch(search, tenantId);
  }



    @Get(':id')
  @Permissions('get_a_products')
  async getProductById(@Param('id', ParseIntPipe) id: number) {
    return this.productService.getProductById(id);
  }


  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('update_products')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumb', maxCount: 1 },
      { name: 'images', maxCount: 10 },
    ]),
  )
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
     @UploadedFiles() files: { thumb?: Express.Multer.File[], images?: Express.Multer.File[] },
  ) {
    const thumb = files.thumb?.[0];
    const images = files.images || [];
    return this.productService.updateProduct(id, dto, thumb, images);
  }






  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('delete_products')
  async deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.deleteProduct(id);
  }
}
