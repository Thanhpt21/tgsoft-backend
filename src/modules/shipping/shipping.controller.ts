// shipping.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { GetRatesDto } from './dto/get-rates.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { TrackingUpdateDto } from './dto/tracking-update.dto';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('rates')
  async getRates(@Body() dto: GetRatesDto) {
    return this.shippingService.getRates(dto.orderId);
  }

  @Post('create')
  async createShipment(@Body() dto: CreateShipmentDto) {
    return this.shippingService.createShipment(dto.orderId, dto);
  }

  //  @Post('tracking-update')
  // async updateTracking(@Body() dto: TrackingUpdateDto) {
  //   const rawData = {
  //     location: dto.location,
  //     eventTime: dto.timestamp,
  //   };
  //   return this.shippingService.handleTrackingUpdates(dto.trackingNo, dto.status, rawData);
  // }

  @Post('webhook')
  async handleWebhook(@Body() dto: TrackingUpdateDto) {
    console.log('📦 Webhook nhận được:', dto);

    const rawData = {
      location: dto.location,
      eventTime: dto.timestamp,
    };
    return this.shippingService.handleTrackingUpdates(dto.trackingNo, dto.status, rawData);
  }


}

