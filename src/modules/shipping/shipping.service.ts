import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { PrismaService } from 'prisma/prisma.service';
import {  REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';
import axios from 'axios';

@Injectable()
export class ShippingService extends TenantAwareService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request,
  ) {
    super(prisma, request);
  }

async getRates(orderId: number) {
  const order = await this.prisma.order.findFirst({
    where: {
      id: orderId,
      tenantId: this.tenantId,
    },
    include: {
      items: { include: { productVariant: true } },
      tenant: true,
    },
  });

  if (!order) throw new Error('Không tìm thấy đơn hàng');

  const payload = this.mapOrderToGoshipRatePayload(order);

  this.logger.debug(`Goship Rate Payload: ${JSON.stringify(payload, null, 2)}`);

  try {
    const response = await axios.post<any>(
      `${process.env.GOSHIP_API_URL}/rates`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.GOSHIP_API_TOKEN}`,
        },
      },
    );

    return response.data?.data;
  } catch (err) {
    this.logger.error('Goship getRates error:', err.response?.data || err.message);
    throw new Error('Không lấy được bảng giá từ GoShip');
  }
}



  async createShipment(orderId: number, dto: CreateShipmentDto) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId: this.tenantId,
      },
      include: {
        items: {
          include: {
            productVariant: true,
          },
        },
      },
    });

    if (!order) throw new Error('Không tìm thấy đơn hàng');

    const payload = this.mapOrderToGoshipShipmentPayload(order, dto);

    try {
      const response = await axios.post<any>(
        `${process.env.GOSHIP_API_URL}/shipping/orders`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.GOSHIP_API_TOKEN}`,
          },
        },
      );

      const goshipData = response.data?.data;
      const trackingCode = goshipData?.tracking_code || 'UNKNOWN';

      const shipment = await this.prisma.shipment.create({
        data: {
          tenantId: this.tenantId,
          orderId: order.id,
          courier: 'goship',
          trackingNo: trackingCode,
          service: dto.service,
          fee: dto.fee,
          status: 'CREATED',
        },
      });

      for (const item of order.items) {
        await this.prisma.shipmentItem.create({
          data: {
            shipmentId: shipment.id,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
          },
        });
      }

      return shipment;
    } catch (err) {
      this.logger.error('Goship createShipment error:', err.response?.data || err.message);
      throw new Error('Không tạo được vận đơn GoShip');
    }
  }


  async handleTrackingUpdates(trackingNo: string, newStatus: string, rawData: any) {
    const shipment = await this.prisma.shipment.findFirst({
      where: {
        trackingNo,
        tenantId: this.tenantId,
      },
    });

    if (!shipment) throw new Error('Shipment không tồn tại');

    await this.prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: newStatus,
      },
    });

    await this.prisma.trackingEvent.create({
      data: {
        shipmentId: shipment.id,
        status: newStatus,
        location: rawData.location || null, // giả định có location trong rawData
        eventTime: new Date(rawData.eventTime || Date.now()),
      },
    });

    return { success: true };
  }

private mapOrderToGoshipRatePayload(order: any) {
  const fromDistrict = order.shippingInfo?.from?.district_id;
  const fromCity = order.shippingInfo?.from?.city_id;
  const toDistrict = order.shippingInfo?.to?.district_id;
  const toCity = order.shippingInfo?.to?.city_id;

  if (!fromDistrict || !fromCity || !toDistrict || !toCity) {
    this.logger.error(`Missing location info in order shippingInfo: fromDistrict=${fromDistrict}, fromCity=${fromCity}, toDistrict=${toDistrict}, toCity=${toCity}`);
    throw new Error('Thông tin địa chỉ người gửi hoặc người nhận không đầy đủ');
  }

  // Tính tổng cân nặng tính bằng gram
  const totalWeight = order.items.reduce((sum, item) => {
    const w = item.productVariant?.weight || 500; // default 500g nếu không có
    return sum + w * item.quantity;
  }, 0);

  // Tính cân nặng quy đổi theo công thức: (Dài x Rộng x Cao) / 6000
  const length = 10;
  const width = 10;
  const height = 10;
  const volumetricWeight = Math.ceil((length * width * height) / 6000 * 1000); // gram, nhân 1000 vì tạm lấy gam

  // Chọn cân nặng lớn hơn giữa cân nặng thực tế và cân nặng quy đổi
  const finalWeight = totalWeight > volumetricWeight ? totalWeight : volumetricWeight;

  return {
    shipment: {
      address_from: {
        district: String(fromDistrict),
        city: String(fromCity),
      },
      address_to: {
        district: String(toDistrict),
        city: String(toCity),
      },
      parcel: {
        cod: order.totalAmount || 0,
        amount: order.totalAmount || 0,
        width,
        height,
        length,
        weight: finalWeight,
      },
    },
  };
}






  private mapOrderToGoshipShipmentPayload(order: any, dto: CreateShipmentDto) {
    return {
      service: dto.service,
      client_id: parseInt(process.env.GOSHIP_CLIENT_ID!, 10),
      sender: {
        name: order.shippingInfo?.from?.name,
        phone: order.shippingInfo?.from?.phone,
        address: order.shippingInfo?.from?.address,
        ward_id: order.shippingInfo?.from?.ward_id,
        district_id: order.shippingInfo?.from?.district_id,
        province_id: order.shippingInfo?.from?.province_id,
      },
      receiver: {
        name: order.shippingInfo?.to?.name,
        phone: order.shippingInfo?.to?.phone,
        address: order.shippingInfo?.to?.address,
        ward_id: order.shippingInfo?.to?.ward_id,
        district_id: order.shippingInfo?.to?.district_id,
        province_id: order.shippingInfo?.to?.province_id,
      },
      items: order.items.map((item) => ({
        name: item.productVariant?.sku || 'Item',
        quantity: item.quantity,
        weight: item.productVariant?.weight || 500,
      })),
      cod_amount: order.totalAmount || 0,
      note: 'Giao hàng cẩn thận',
    };
  }


}

