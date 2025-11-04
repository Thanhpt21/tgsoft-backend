// src/config/dto/config-response.dto.ts
export class ConfigResponseDto {
  id: number;

  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  address?: string | null;
  googlemap?: string | null;
  facebook?: string | null;
  zalo?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  x?: string | null;
  linkedin?: string | null;
  logo?: string | null;

  showEmail?: boolean;
  showMobile?: boolean;
  showAddress?: boolean;
  showGooglemap?: boolean;
  showFacebook?: boolean;
  showZalo?: boolean;
  showInstagram?: boolean;
  showTiktok?: boolean;
  showYoutube?: boolean;
  showX?: boolean;
  showLinkedin?: boolean;

  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ConfigResponseDto>) {
    Object.assign(this, partial);
  }
}