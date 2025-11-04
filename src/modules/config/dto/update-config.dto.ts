// src/config/dto/update-config.dto.ts
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateConfigDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  googlemap?: string;

  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsString()
  zalo?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  tiktok?: string;

  @IsOptional()
  @IsString()
  youtube?: string;

  @IsOptional()
  @IsString()
  x?: string;

  @IsOptional()
  @IsString()
  linkedin?: string;

  @IsOptional()
  @IsBoolean()
  showEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  showMobile?: boolean;

  @IsOptional()
  @IsBoolean()
  showAddress?: boolean;

  @IsOptional()
  @IsBoolean()
  showGooglemap?: boolean;

  @IsOptional()
  @IsBoolean()
  showFacebook?: boolean;

  @IsOptional()
  @IsBoolean()
  showZalo?: boolean;

  @IsOptional()
  @IsBoolean()
  showInstagram?: boolean;

  @IsOptional()
  @IsBoolean()
  showTiktok?: boolean;

  @IsOptional()
  @IsBoolean()
  showYoutube?: boolean;

  @IsOptional()
  @IsBoolean()
  showX?: boolean;

  @IsOptional()
  @IsBoolean()
  showLinkedin?: boolean;
}