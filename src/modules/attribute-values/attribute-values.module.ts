import { Module } from '@nestjs/common';
import { AttributeValuesService } from './attribute-values.service';
import { AttributeValuesController } from './attribute-values.controller';
import { PrismaService } from 'prisma/prisma.service';


@Module({
  controllers: [AttributeValuesController],
  providers: [AttributeValuesService, PrismaService],
})
export class AttributeValuesModule {}