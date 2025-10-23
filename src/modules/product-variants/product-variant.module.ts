import { Module } from '@nestjs/common';
import { ProductVariantController } from './product-variant.controller';
import { ProductVariantService } from './product-variant.service';
import { PrismaService } from 'prisma/prisma.service';
import { UploadModule } from '../upload/upload.module';

@Module({
   imports: [UploadModule],
  controllers: [ProductVariantController],
  providers: [ProductVariantService, PrismaService],
})
export class ProductVariantModule {}
