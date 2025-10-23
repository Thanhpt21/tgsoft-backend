import { IsInt } from 'class-validator';

export class CreateUserTenantRoleDto {
  @IsInt()
  userId: number;

  @IsInt()
  tenantId: number;

  @IsInt()
  roleId: number;
}
