export class BrandResponseDto {
  id: number;
  tenantId: number;
  name: string;
  slug: string;
  description: string | null;
  thumb: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<BrandResponseDto>) {
    Object.assign(this, partial);
  }
}
