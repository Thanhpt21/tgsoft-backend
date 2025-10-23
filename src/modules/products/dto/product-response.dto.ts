import { AttributeResponseDto } from '../../attributes/dto/attribute-response.dto';

export class ProductResponseDto {
  id: number;
  tenantId: number;
  name: string;
  slug: string;
  description?: string | null;
  basePrice: number;
  thumb?: string | null;
  images?: string[] | null;
  status: string;
  isPublished: boolean;
  isFeatured: boolean;
  totalRatings: number;
  totalReviews: number;
  numberSold: number;
  categoryId?: number | null;
  brandId?: number | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  createdAt: Date;
  updatedAt: Date;
  createdById?: number | null;


  constructor(partial: any) {
    Object.assign(this, partial);


    // Parse images từ JSON/array
    if (partial.images) {
      try {
        if (typeof partial.images === 'string') {
          const parsed = JSON.parse(partial.images);
          this.images = Array.isArray(parsed) ? parsed : [parsed];
        } else if (Array.isArray(partial.images)) {
          this.images = partial.images;
        } else {
          this.images = null;
        }
      } catch (error) {
        this.images = null;
      }
    }
  }
}