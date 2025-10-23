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
} from '@nestjs/common';

import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { AttributeResponseDto } from './dto/attribute-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { AttributesService } from './attribute.service';

@Controller('attributes')

export class AttributeController {
  constructor(private readonly attributeService: AttributesService) {}

  // Tạo attribute mới
  @Post()
@UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('create_attributes')
  async createAttribute(@Body() dto: CreateAttributeDto) {
    return this.attributeService.create(dto);
  }

  // Lấy danh sách attribute (phân trang + search)
  @Get()
  @Permissions('read_attributes')
  async getAttributes(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
  ) {
    return this.attributeService.getAttributes(+page, +limit, search);
  }

  @Get('all/list')
  @Permissions('read_all_attributes')
  async getAllAttributes(@Query('search') search: string = '') {
    return this.attributeService.getAllAttributes(search);
  }

  // Lấy attribute theo id
  @Get(':id')
  @Permissions('get_a_attributes')
  async getAttributeById(@Param('id', ParseIntPipe) id: number) {
    return this.attributeService.getAttributeById(id);
  }

  // Cập nhật attribute
  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('update_attributes')
  async updateAttribute(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAttributeDto,
  ) {
    return this.attributeService.updateAttribute(id, dto);
  }

  // Xóa attribute
  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('delete_attributes')
  async deleteAttribute(@Param('id', ParseIntPipe) id: number) {
    return this.attributeService.deleteAttribute(id);
  }
}
