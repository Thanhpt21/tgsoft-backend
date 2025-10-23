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
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ConfigResponseDto>) {
    Object.assign(this, partial);
  }
}
