import { Controller, Get, Post, Delete, Param, Body, ParseIntPipe, Query, UseGuards, Put, BadRequestException } from '@nestjs/common';
import { VariantAttributeValuesService } from './variant-attribute-values.service';
import { CreateVariantAttributeValueDto } from './dto/create-variant-attribute-value.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { UpdateVariantAttributeValueDto } from './dto/update-variant-attribute-value.dto';

@Controller('variant-attribute-values')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VariantAttributeValuesController {
  constructor(private readonly service: VariantAttributeValuesService) {}

  @Post()
  @Permissions('create_variant_attribute_value')
  async create(@Body() dto: CreateVariantAttributeValueDto) {
    return this.service.create(dto);
  }

  @Get()
  @Permissions('read_variant_attribute_values')
  async findAll(@Query('variantId') variantId: string) {
    if (!variantId) {
      throw new BadRequestException('variantId is required');
    }
    return this.service.findAll(+variantId);
  }

  @Get(':variantId/:attributeValueId')
  @Permissions('get_a_variant_attribute_value')
  async findOne(
    @Param('variantId', ParseIntPipe) variantId: number,
    @Param('attributeValueId', ParseIntPipe) attributeValueId: number,
  ) {
    return this.service.findOne(variantId, attributeValueId);
  }

   @Put(':variantId/:attributeValueId')
  @Permissions('update_variant_attribute_value')
  async update(
    @Param('variantId', ParseIntPipe) variantId: number,
    @Param('attributeValueId', ParseIntPipe) attributeValueId: number,
    @Body() dto: UpdateVariantAttributeValueDto,
  ) {
    return this.service.update(variantId, attributeValueId, dto);
  }

  @Delete(':variantId/:attributeValueId')
  @Permissions('delete_variant_attribute_value')
  async delete(
    @Param('variantId', ParseIntPipe) variantId: number,
    @Param('attributeValueId', ParseIntPipe) attributeValueId: number,
  ) {
    return this.service.delete(variantId, attributeValueId);
  }

  
}
