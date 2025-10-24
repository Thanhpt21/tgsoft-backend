import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpdateTenantTierLimitsDto } from './dto/update-tenant-tier-limit';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // Tạo tenant mới
  @Post()
  @UseGuards(JwtAuthGuard)
  async createTenant(@Body() createTenantDto: CreateTenantDto) {
    return await this.tenantsService.create(createTenantDto);
  }

  // Lấy danh sách tenant với phân trang + search
  @Get()
  async getTenants(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
  ) {
    return await this.tenantsService.getTenants(+page, +limit, search);
  }

  // Lấy tenant theo id
  @Get(':id')
  async getTenantById(@Param('id', ParseIntPipe) id: number) {
    return await this.tenantsService.getTenantById(id);
  }

  @Put(':id/tier-limits')
  @UseGuards(JwtAuthGuard)
  updateTierLimits(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTenantTierLimitsDto: UpdateTenantTierLimitsDto,
  ) {
    return this.tenantsService.updateTierLimits(id, updateTenantTierLimitsDto);
  }

  // Cập nhật tenant
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateTenant(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return await this.tenantsService.updateTenant(id, updateTenantDto);
  }

  // Toggle trạng thái isActive
  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard)
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return await this.tenantsService.toggleStatus(id);
  }

  // Xóa tenant
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteTenant(@Param('id', ParseIntPipe) id: number) {
    return await this.tenantsService.deleteTenant(id);
  }
}
