// payments.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { VnpayService } from './vnpay.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService, VnpayService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
