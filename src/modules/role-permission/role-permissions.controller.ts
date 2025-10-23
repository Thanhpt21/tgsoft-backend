import { Controller, Post, Body, Delete, Param, Get, ParseIntPipe, UseGuards } from '@nestjs/common';
import { RolePermissionsService } from './role-permissions.service';
import { CreateRolePermissionDto } from './dto/create-role-permission.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user.enums';

@Controller('role-permissions')
export class RolePermissionsController {
  constructor(private readonly service: RolePermissionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async addPermission(@Body() dto: CreateRolePermissionDto) {
    return this.service.addPermission(dto);
  }

  @Delete(':roleId/:permissionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async removePermission(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.service.removePermission(roleId, permissionId);
  }

  @Get(':roleId')
  async getPermissionsOfRole(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.service.getPermissionsOfRole(roleId);
  }
}
