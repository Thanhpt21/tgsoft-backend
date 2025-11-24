import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  type_account?: string;

  @IsOptional()
  @IsNumber()
  tenantId?: number;

  @IsOptional()
  @IsNumber()
  tokenAI?: number;

  @IsOptional()
  @IsNumber()
  defaultTokens?: number; // Token mặc định (renew hàng tháng)

  @IsOptional()
  @IsNumber()
  fixedTokens?: number; // Token cố định (không bị reset)
}
