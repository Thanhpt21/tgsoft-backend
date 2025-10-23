import { 
  IsOptional, 
  IsString, 
  IsNumber, 
  ValidateNested, 
  ArrayMaxSize, 
  IsBoolean, 
  IsArray 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductAttributeDto } from './create-product.dto';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  thumb?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

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

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  @ArrayMaxSize(3, { message: 'Max 3 attributes per product' })
  attributes?: ProductAttributeDto[];
}
