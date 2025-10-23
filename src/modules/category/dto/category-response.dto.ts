export class CategoryResponseDto {
  id: number;
  tenantId: number;
  parentId?: number;
  name: string;
  slug: string;
  description?: string;
  thumb?: string;
  status: string;
  position: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(category: any) {
    this.id = category.id;
    this.tenantId = category.tenantId;
    this.parentId = category.parentId ?? undefined;
    this.name = category.name;
    this.slug = category.slug;
    this.description = category.description ?? undefined;
    this.thumb = category.thumb ?? undefined;
    this.status = category.status;
    this.position = category.position;
    this.seoTitle = category.seoTitle ?? undefined;
    this.seoDescription = category.seoDescription ?? undefined;
    this.seoKeywords = category.seoKeywords ?? undefined;
    this.createdAt = category.createdAt;
    this.updatedAt = category.updatedAt;
  }
}
