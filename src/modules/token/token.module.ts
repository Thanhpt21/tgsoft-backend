// src/token/token.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TokenRenewService } from './token-renew.service';
import { TokenCheckService } from './token-check.service';
import { TokenController } from './token.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [TokenController],
  providers: [TokenRenewService, TokenCheckService, PrismaService],
  exports: [TokenRenewService, TokenCheckService],
})
export class TokenModule {}