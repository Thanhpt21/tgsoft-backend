import { Module } from '@nestjs/common';
import { UserTenantRolesService } from './user-tenant-roles.service';
import { UserTenantRolesController } from './user-tenant-roles.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [UserTenantRolesController],
  providers: [UserTenantRolesService, PrismaService],
})
export class UserTenantRolesModule {}
