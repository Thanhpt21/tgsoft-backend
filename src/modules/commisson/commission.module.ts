// src/modules/commission/commission.module.ts
import { Module } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { CommissionController } from './commission.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [CommissionController],
  providers: [CommissionService, PrismaService],
  exports: [CommissionService],
})
export class CommissionModule {}
