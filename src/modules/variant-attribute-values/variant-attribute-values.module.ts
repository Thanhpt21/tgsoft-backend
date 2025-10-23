import { Module } from '@nestjs/common';
import { VariantAttributeValuesService } from './variant-attribute-values.service';
import { VariantAttributeValuesController } from './variant-attribute-values.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [VariantAttributeValuesController],
  providers: [VariantAttributeValuesService, PrismaService],
})
export class VariantAttributeValuesModule {}
