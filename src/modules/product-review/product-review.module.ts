import { Module } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ProductReviewService } from './product-review.service';
import { ProductReviewController } from './product-review.controller';

@Module({
  controllers: [ProductReviewController],
  providers: [ProductReviewService, PrismaService],
  exports: [ProductReviewService],
})
export class ProductReviewModule {}