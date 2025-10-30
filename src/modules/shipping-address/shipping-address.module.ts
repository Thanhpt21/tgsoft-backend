import { Module } from '@nestjs/common';
import { ShippingAddressService } from './shipping-address.service';
import { ShippingAddressController } from './shipping-address.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [ShippingAddressController],
  providers: [ShippingAddressService, PrismaService],
  exports: [ShippingAddressService],
})
export class ShippingAddressModule {}
