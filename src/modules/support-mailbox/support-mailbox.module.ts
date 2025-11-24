import { Module } from '@nestjs/common';
import { SupportMailboxService } from './support-mailbox.service';
import { SupportMailboxController } from './support-mailbox.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [SupportMailboxController],
  providers: [SupportMailboxService, PrismaService],
})
export class SupportMailboxModule {}