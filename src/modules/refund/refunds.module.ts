// src/refunds/refunds.module.ts
import { Module } from '@nestjs/common';
import { RefundsService } from './refunds.service';
import { RefundsController } from './refunds.controller';
import { PrismaService } from 'prisma/prisma.service'; 

@Module({
  imports: [], 
  controllers: [RefundsController],
  providers: [RefundsService, PrismaService], 
  exports: [RefundsService], 
})
export class RefundsModule {}