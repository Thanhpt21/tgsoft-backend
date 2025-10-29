import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProductReviewService } from './product-review.service';
import { UpdateProductReviewDto } from './dto/update-product-review.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { CreateProductReviewDto } from './dto/create-product-review.dto';

@Controller('product-reviews')
export class ProductReviewController {
  constructor(private readonly productReviewService: ProductReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Permissions('create_product_reviews')
  async createProductReview(
    @Body() dto: CreateProductReviewDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.productReviewService.create(dto, userId);
  }

  @Get()
  async getProductReviews(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
  ) {
    return this.productReviewService.getProductReviews(+page, +limit, search);
  }

  @Get('product/:productId')
  async getProductReviewsByProductId(
    @Param('productId', ParseIntPipe) productId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
  ) {
    return this.productReviewService.getProductReviewsByProductId(
      productId,
      +page,
      +limit,
      search,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Permissions('get_product_reviews')
  async getProductReviewById(@Param('id', ParseIntPipe) id: number) {
    return this.productReviewService.getProductReviewById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Permissions('update_product_reviews')
  async updateProductReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductReviewDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.productReviewService.updateProductReview(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Permissions('delete_product_reviews')
  async deleteProductReview(@Param('id', ParseIntPipe) id: number) {
    return this.productReviewService.deleteProductReview(id);
  }
}