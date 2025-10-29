import { 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  IsString, 
  MaxLength, 
  IsBoolean, 
  Min, 
  Max 
} from 'class-validator';

export class CreateProductReviewDto {
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  rating: number;

  @IsOptional()
  @IsNumber()
  orderId?: number;

  @IsOptional()
  @IsNumber()
  orderItemId?: number;

  @IsOptional()
  @IsBoolean()
  isPurchased?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Comment must not exceed 1000 characters' })
  comment?: string;
}