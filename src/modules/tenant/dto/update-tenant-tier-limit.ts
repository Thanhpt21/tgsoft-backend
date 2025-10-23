import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateTenantTierLimitsDto {
  @IsOptional()
  @IsInt({ message: 'Giới hạn tài khoản phải là số nguyên' })
  @Min(1, { message: 'Giới hạn tài khoản phải lớn hơn 0' })
  maxAccounts?: number;

  @IsOptional()
  @IsInt({ message: 'Giới hạn SKU phải là số nguyên' })
  @Min(1, { message: 'Giới hạn SKU phải lớn hơn 0' })
  maxSKUs?: number;

  @IsOptional()
  @IsInt({ message: 'Giới hạn người dùng đồng thời phải là số nguyên' })
  @Min(1, { message: 'Giới hạn người dùng đồng thời phải lớn hơn 0' })
  maxConcurrentUsers?: number;
}