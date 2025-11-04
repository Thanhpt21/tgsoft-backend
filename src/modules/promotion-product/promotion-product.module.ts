import { Module } from '@nestjs/common';
import { PromotionProductService } from './promotion-product.service';
import { PromotionProductController } from './promotion-product.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [PromotionProductController],
  providers: [PromotionProductService, PrismaService],
})
export class PromotionProductModule {}
