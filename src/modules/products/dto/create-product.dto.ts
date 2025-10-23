import { 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  IsString, 
  MaxLength, 
  ValidateNested, 
  ArrayMaxSize, 
  IsBoolean, 
  IsArray 
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductAttributeDto {
  @IsNumber()
  attributeId: number;
}

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  basePrice: number;

   @IsNotEmpty()
  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  thumb?: string;

  @IsOptional()
  @IsArray()
  images?: string[]; // hoặc Json nếu bạn dùng upload multiple file

  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'OUT_OF_STOCK' | 'DELETED';

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsNumber()
  brandId?: number;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsString()
  seoKeywords?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  length?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsNumber()
  tenantId: number;

  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  @ArrayMaxSize(3, { message: 'Max 3 attributes per product' })
  @IsOptional()
  attributes?: ProductAttributeDto[];
}
