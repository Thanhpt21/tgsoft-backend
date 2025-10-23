import { IsString, IsOptional } from 'class-validator';

export class CreateGHTKConfigDto {
  @IsOptional()
  @IsString()
  pickName?: string;

  @IsOptional()
  @IsString()
  pickPhone?: string;

  @IsOptional()
  @IsString()
  pickAddress?: string;

  @IsOptional()
  @IsString()
  pickProvince?: string;

  @IsOptional()
  @IsString()
  pickDistrict?: string;

  @IsOptional()
  @IsString()
  pickWard?: string;
}
