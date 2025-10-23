import { Module } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { FinancialTransactionController } from './financial-transaction.controller';
import { FinancialTransactionService } from './financial-transaction.service';

@Module({
  imports: [],
  controllers: [FinancialTransactionController],
  providers: [FinancialTransactionService, PrismaService],
})
export class FinancialTransactionModule {}
