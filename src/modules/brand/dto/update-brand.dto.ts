import { IsString, IsOptional } from 'class-validator';

export class UpdateBrandDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumb?: string;

  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE' | 'DELETED';
}
