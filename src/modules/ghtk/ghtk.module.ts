import { Module } from '@nestjs/common';
import { GhtkService } from './ghtk.service';
import { GhtkController } from './ghtk.controller';
import { PrismaModule } from 'prisma/prisma.module';
import { PrismaService } from 'prisma/prisma.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [GhtkController],
  providers: [GhtkService, PrismaService],
  exports: [GhtkService], 
})
export class GhtkModule {}