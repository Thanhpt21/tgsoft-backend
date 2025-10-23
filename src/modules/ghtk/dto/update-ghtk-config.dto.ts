import { IsString, IsOptional, IsBoolean } from 'class-validator';
export class UpdateGHTKConfigDto {
  @IsString()
  @IsOptional()
  pickName?: string;

  @IsString()
  @IsOptional()
  pickPhone?: string;

  @IsString()
  @IsOptional()
  pickAddress?: string;

  @IsString()
  @IsOptional()
  pickProvince?: string;

  @IsString()
  @IsOptional()
  pickDistrict?: string;

  @IsString()
  @IsOptional()
  pickWard?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}