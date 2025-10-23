import { Module } from '@nestjs/common';

import { PrismaService } from 'prisma/prisma.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { InventoryModule } from '../inventory/inventory.module';
import { InventoryService } from '../inventory/inventory.service';

@Module({
  imports: [InventoryModule],
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService, InventoryService],
  exports: [OrdersService],
})
export class OrderModule {}

