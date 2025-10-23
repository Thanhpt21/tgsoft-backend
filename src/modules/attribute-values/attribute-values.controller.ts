import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AttributeValuesService } from './attribute-values.service';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('attribute-values')
export class AttributeValuesController {
  constructor(private readonly service: AttributeValuesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('create_attribute_values')
  async create(@Body() dto: CreateAttributeValueDto) {
    return this.service.create(dto);
  }

  @Get()
  @Permissions('read_attribute_values')
  async getAll(@Query('attributeId') attributeId?: number) {
    return this.service.getAll(attributeId ? +attributeId : undefined);
  }

  @Get(':id')
  @Permissions('get_a_attribute_value')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('update_attribute_values')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAttributeValueDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('delete_attribute_values')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
