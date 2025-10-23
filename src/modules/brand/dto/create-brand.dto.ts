import { IsString, IsOptional } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumb?: string;

  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE' | 'DELETED';
}
