import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { AttributeController } from './attribute.controller';
import { AttributesService } from './attribute.service';

@Module({
  imports: [PrismaModule],
  providers: [AttributesService],
  controllers: [AttributeController],
  exports: [AttributesService],
})
export class AttributeModule {}
