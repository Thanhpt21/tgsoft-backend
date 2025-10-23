import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { CategoryService } from './category.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard'
import { PermissionsGuard } from 'src/common/guards/permissions.guard'
import { Permissions } from 'src/common/decorators/permissions.decorator'

@Controller('categories')

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('create_categories')
  @UseInterceptors(FileInterceptor('thumb'))
  async create(
    @Body() dto: CreateCategoryDto,
    @UploadedFile() thumb?: Express.Multer.File,
  ) {
    return this.categoryService.create(dto, thumb)
  }

  @Get()
  @Permissions('read_categories')
  async getAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
  ) {
    return this.categoryService.getCategories(page, limit, search)
  }

  @Get('all/list')
  @Permissions('read_all_categories')
  async search(@Query('search') search: string = '') {
    return this.categoryService.getAll(search)
  }

  @Get(':id')
  @Permissions('get_a_category')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.getById(id)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('update_categories')
  @UseInterceptors(FileInterceptor('thumb'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
    @UploadedFile() thumb?: Express.Multer.File,
  ) {
    return this.categoryService.update(id, dto, thumb)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('delete_categories')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.delete(id)
  }
}
