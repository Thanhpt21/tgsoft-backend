import { 
  Controller, Get, Post, Put, Delete, Body, Param, 
  ParseIntPipe, UseGuards, Query, UseInterceptors, 
  UploadedFile 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('brands')

export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('create_brands')
  @UseInterceptors(FileInterceptor('thumb')) // Thêm interceptor để nhận file
  async create(
    @Body() dto: CreateBrandDto,
    @UploadedFile() file?: Express.Multer.File, // Nhận file upload
  ) {
    return this.brandService.create(dto, file);
  }

  @Get()
  @Permissions('read_brands')
  async getBrands(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
  ) {
    return this.brandService.getBrands(page, limit, search);
  }

  @Get('all/list')
  @Permissions('read_all_brands')
  async getAll(@Query('search') search: string = '') {
    return this.brandService.getAll(search);
  }

  @Get(':id')
  @Permissions('get_a_brands')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.brandService.getById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('update_brands')
  @UseInterceptors(FileInterceptor('thumb')) // Thêm interceptor cho update
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBrandDto,
    @UploadedFile() file?: Express.Multer.File, // Nhận file upload
  ) {
    return this.brandService.update(id, dto, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('delete_brands')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.brandService.delete(id);
  }
}