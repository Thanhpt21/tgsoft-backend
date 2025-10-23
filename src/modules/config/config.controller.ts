import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseInterceptors, UploadedFile, UseGuards, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from './config.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('configs')

export class ConfigController {
  constructor(private readonly configService: ConfigService) {}
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post()
  @Permissions('create_configs')
  @UseInterceptors(FileInterceptor('logo'))
  async create(@Body() dto: CreateConfigDto, @UploadedFile() file?: Express.Multer.File) {
    return this.configService.create(dto, file);
  }

  @Get()
  async getAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
  ) {
    return this.configService.getConfigs(Number(page), Number(limit), search);
  }
  
  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.configService.getById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('update_configs')
  @UseInterceptors(FileInterceptor('logo'))
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateConfigDto, @UploadedFile() file?: Express.Multer.File) {
    return this.configService.update(id, dto, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('delete_configs')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.configService.delete(id);
  }
}
