import { ShippingAddress } from '@prisma/client'; // Giả sử bạn có mô hình ShippingAddress trong Prisma

export class ShippingAddressResponseDto {
  id: number;
  tenantId: number;
  userId?: number | null;
  name: string;
  phone: string;
  address: string;
  note?: string | null;
  province_id: number;
  province: string;
  district_id: number;
  district: string;
  ward_id: number;
  ward: string;
  province_name?: string | null;
  district_name?: string | null;
  ward_name?: string | null;
  is_default: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(shippingAddress: ShippingAddress) {
    this.id = shippingAddress.id;
    this.tenantId = shippingAddress.tenantId;
    this.userId = shippingAddress.userId ?? null; // nếu userId là undefined, gán null
    this.name = shippingAddress.name;
    this.phone = shippingAddress.phone;
    this.address = shippingAddress.address;
    this.note = shippingAddress.note ?? null; // nếu note là undefined, gán null
    this.province_id = shippingAddress.province_id;
    this.province = shippingAddress.province;
    this.district_id = shippingAddress.district_id;
    this.district = shippingAddress.district;
    this.ward_id = shippingAddress.ward_id;
    this.ward = shippingAddress.ward;
    this.province_name = shippingAddress.province_name ?? null;
    this.district_name = shippingAddress.district_name ?? null;
    this.ward_name = shippingAddress.ward_name ?? null;
    this.is_default = shippingAddress.is_default;
    this.createdAt = shippingAddress.createdAt;
    this.updatedAt = shippingAddress.updatedAt;
  }
}
