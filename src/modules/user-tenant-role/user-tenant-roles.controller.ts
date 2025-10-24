import { Controller, Post, Body, Delete, Param, Get, ParseIntPipe, UseGuards } from '@nestjs/common';
import { UserTenantRolesService } from './user-tenant-roles.service';
import { CreateUserTenantRoleDto } from './dto/create-user-tenant-role.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';


@Controller('user-tenant-roles')
export class UserTenantRolesController {
  constructor(private readonly service: UserTenantRolesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async addRole(@Body() dto: CreateUserTenantRoleDto) {
    return this.service.addRole(dto);
  }

  @Delete(':userId/:tenantId/:roleId')
  @UseGuards(JwtAuthGuard)
  async removeRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.service.removeRole(userId, tenantId, roleId);
  }

  @Get('user/:userId/tenant/:tenantId')
  async getRolesOfUserInTenant(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('tenantId', ParseIntPipe) tenantId: number,
  ) {
    return this.service.getRolesOfUserInTenant(userId, tenantId);
  }

  @Get('tenant/:tenantId/users')
  async getUsersOfTenant(@Param('tenantId', ParseIntPipe) tenantId: number) {
    return this.service.getUsersOfTenant(tenantId);
  }
}
