import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { CalculateFeeDto } from './dto/calculate-fee.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class GhtkService {
  private readonly partnerCode = 'S22947076'; // Mã đối tác GHTK
  private readonly apiToken = '2OErom7B3lJXh63pPHHVeCqE7LMzhbJO5tlZQdl'; // API token GHTK
  private readonly baseApiUrl = 'https://services.giaohangtietkiem.vn'; // Base URL của GHTK
  private readonly openApiProvincesBaseUrl = 'https://provinces.open-api.vn/api'; // Base URL API tỉnh

  constructor(private readonly httpService: HttpService,  private readonly prisma: PrismaService) {}

  // Tính phí vận chuyển
  async calculateShippingFee(calculateFeeDto: CalculateFeeDto) {
    try {
      const response: AxiosResponse<any, any, {}> | undefined = await this.httpService
        .post(
          `${this.baseApiUrl}/services/shipment/fee`,
          calculateFeeDto, // Dữ liệu tính phí
          {
            headers: {
              'Partner-Code': this.partnerCode, // Header GHTK
              'Token': this.apiToken, // Token của bạn
            },
          },
        )
        .toPromise();

      if (!response || !response.data || response.data.error) {
        throw new BadRequestException('Không thể tính phí vận chuyển.');
      }

      return response.data; // Trả về dữ liệu phí vận chuyển
    } catch (error) {
      throw new BadRequestException('Lỗi trong quá trình tính phí vận chuyển');
    }
  }

  // Tạo đơn hàng trên GHTK
async createGHTKOrder(orderId: number) {
  try {
    // 1. LẤY ORDER TỪ DB
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            productVariant: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw new BadRequestException(`Order ID ${orderId} không tồn tại`);
    }

    const shippingInfo = order.shippingInfo as any;
    if (!shippingInfo) {
      throw new BadRequestException('Thiếu thông tin giao hàng');
    }

    // 2. MAP PRODUCTS – weight: gram → kg (GHTK dùng kg)
    const products = order.items.map((item) => {
      const weightInGram = item.productVariant?.product?.weight || 1000;
      const weightInKg = Number((weightInGram / 1000).toFixed(3)); // 1000g → 1.000kg

      return {
        name: item.productVariant?.product?.name || item.sku || 'Sản phẩm',
        weight: weightInKg, // GHTK yêu cầu kg
        quantity: item.quantity,
        price: item.unitPrice,
      };
    });

    // TÍNH TỔNG GIÁ TRỊ HÀNG (chỉ tiền hàng)
    const totalProductValue = products.reduce(
      (sum, p) => sum + p.price * p.quantity,
      0
    );

    // TÍNH TỔNG TRỌNG LƯỢNG (kg)
    const totalWeightKg = products.reduce(
      (sum, p) => sum + p.weight * p.quantity,
      0
    );

    console.log('Tổng trọng lượng (kg):', totalWeightKg);
    if (totalWeightKg >= 20) {
      throw new BadRequestException(
        `Đơn hàng nặng ${totalWeightKg}kg ≥ 20kg, GHTK không nhận`
      );
    }

    // 3. XỬ LÝ ĐỊA CHỈ – BẮT BUỘC CÓ THÔN/ẤP/KHU PHỐ
    const provinceName = shippingInfo.province_name || shippingInfo.province || '';
    const districtName = shippingInfo.district_name || shippingInfo.district || '';
    const wardName = shippingInfo.ward_name || shippingInfo.ward || '';

    if (!provinceName || !districtName || !wardName) {
      throw new BadRequestException('Thiếu tên tỉnh/huyện/xã');
    }

    // Địa chỉ người nhận – tự động thêm thôn/ấp/khu phố
    const baseAddress = (shippingInfo.address || '').trim();

    let detailedAddress = baseAddress;
    const hasVillageDetail = /thôn|ấp|xóm|tổ|khu phố|kp\.|th\.|ấp\.|xóm\./i.test(detailedAddress);

    if (!hasVillageDetail) {
      if (wardName.includes('Xã') || wardName.includes('Thị trấn')) {
        detailedAddress = `${baseAddress}, Thôn 1`;
      } else if (wardName.includes('Phường')) {
        detailedAddress = `${baseAddress}, Khu phố 1`;
      }
    }

    // Gộp đầy đủ: số nhà + thôn + xã + huyện
    const finalReceiverAddress = [detailedAddress, wardName, districtName]
      .filter(Boolean)
      .join(', ')
      .replace(/,\s*,/g, ',')
      .trim();

    // Địa chỉ người gửi – cứng, đầy đủ
    const fullPickAddress = '35/28 Đường số 8, Khu phố 6, Phường Bình Thọ, Thành phố Thủ Đức';

    // 4. TẠO PAYLOAD GHTK
    const ghtkPayload = {
      products,
      order: {
        // ID DUY NHẤT – tránh trùng
        id: `GHTK-${order.id}-${Date.now()}`,

        // NGƯỜI GỬI
        pick_name: 'Thành',
        pick_address: fullPickAddress,
        pick_province: 'Thành phố Hồ Chí Minh',
        pick_district: 'Thành phố Thủ Đức',
        pick_ward: 'Phường Bình Thọ',
        pick_tel: '0123456789',
        pick_money: 0, // Tiền thu hộ (nếu có)

        // NGƯỜI NHẬN
        tel: (shippingInfo.phone || '').replace(/[^0-9]/g, '').padStart(10, '0'),
        name: shippingInfo.name || 'Khách lẻ',
        address: finalReceiverAddress,
        province: provinceName,
        district: districtName,
        ward: wardName,

        // VALUE & COD = TỔNG TIỀN HÀNG (từ products)
        value: totalProductValue,
        cod: totalProductValue,

        deliver_option: order.deliveryMethod === 'STANDARD' ? 'standard' : 'xteam',
        transport: 'road',
      },
    };

    // LOG DEBUG
    console.log('GHTK Payload:', JSON.stringify(ghtkPayload, null, 2));
    console.log('Tổng tiền hàng (value/cod):', totalProductValue);
    console.log('Tổng trọng lượng (kg):', totalWeightKg);
    console.log('Địa chỉ nhận:', finalReceiverAddress);

    // 5. GỬI REQUEST
    const response = await this.httpService
      .post<any>(
        `${this.baseApiUrl}/services/shipment/order`,
        ghtkPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            Token: this.apiToken,
          },
        }
      )
      .toPromise();

    if (!response?.data) {
      throw new BadRequestException('Không nhận được phản hồi từ GHTK');
    }

    // 6. KIỂM TRA KẾT QUẢ
    if (!response.data.success) {
      console.error('GHTK ERROR:', response.data);
      throw new BadRequestException(response.data.message || 'Tạo đơn GHTK thất bại');
    }

    console.log('GHTK ORDER CREATED:', response.data);

    // 7. CẬP NHẬT TRẠNG THÁI
    if (response.data.order?.tracking_id) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PROCESSING',
          // trackingId: response.data.order.tracking_id, // nếu có field
        },
      });
    }

    return response.data;
  } catch (error) {
    console.error('CREATE GHTK ORDER FAILED:', error);

    if (error instanceof BadRequestException) {
      throw error;
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'Lỗi không xác định khi tạo đơn GHTK';

    throw new BadRequestException(message);
  }
}

  // Hủy đơn hàng trên GHTK
  async cancelGHTKOrder(orderId: number) {
    try {
      const response: AxiosResponse<any, any, {}> | undefined = await this.httpService
        .post(
          `${this.baseApiUrl}/services/shipment/cancel`,
          { order_id: orderId },
          {
            headers: {
              'Partner-Code': this.partnerCode,
              'Token': this.apiToken,
            },
          },
        )
        .toPromise();

      if (!response || !response.data || response.data.error) {
        throw new BadRequestException('Không thể hủy đơn hàng.');
      }

      return response.data; // Trả về dữ liệu kết quả hủy đơn hàng
    } catch (error) {
      throw new BadRequestException('Lỗi khi hủy đơn hàng');
    }
  }

  // Theo dõi đơn hàng trên GHTK
  async trackGHTKOrder(trackingCode: string) {
    try {
      const response: AxiosResponse<any, any, {}> | undefined = await this.httpService
        .get(
          `${this.baseApiUrl}/services/shipment/detail`,
          {
            params: { tracking_code: trackingCode },
            headers: {
              'Partner-Code': this.partnerCode,
              'Token': this.apiToken,
            },
          },
        )
        .toPromise();

      if (!response || !response.data || response.data.error) {
        throw new NotFoundException('Không thể tìm thấy thông tin đơn hàng.');
      }

      return response.data; // Trả về thông tin theo dõi đơn hàng
    } catch (error) {
      throw new NotFoundException('Lỗi khi theo dõi đơn hàng');
    }
  }
  

  // In nhãn cho đơn hàng
  async printGHTKLabel(orderId: number) {
    try {
      const response: AxiosResponse<any, any, {}> | undefined = await this.httpService
        .post(
          `${this.baseApiUrl}/services/label`,
          { order_id: orderId },
          {
            headers: {
              'Partner-Code': this.partnerCode,
              'Token': this.apiToken,
            },
          },
        )
        .toPromise();

      if (!response || !response.data || response.data.error) {
        throw new BadRequestException('Không thể in nhãn đơn hàng.');
      }

      return response.data; // Trả về nhãn in đơn hàng
    } catch (error) {
      throw new BadRequestException('Lỗi khi in nhãn đơn hàng');
    }
  }

  // Lấy danh sách các tỉnh từ API mở
  async getProvincesOpenAPI() {
    try {
      const response: AxiosResponse<any, any, {}> | undefined = await this.httpService
        .get(`${this.openApiProvincesBaseUrl}/provinces`)
        .toPromise();

      if (!response || !response.data) {
        throw new NotFoundException('Không tìm thấy danh sách tỉnh.');
      }

      return response.data; // Trả về danh sách tỉnh
    } catch (error) {
      throw new NotFoundException('Lỗi khi lấy danh sách các tỉnh.');
    }
  }

  // Lấy danh sách các quận/huyện theo mã tỉnh
  async getDistrictsOpenAPI(provinceCode: string) {
    try {
      const response: AxiosResponse<any, any, {}> | undefined = await this.httpService
        .get(`${this.openApiProvincesBaseUrl}/districts/${provinceCode}`)
        .toPromise();

      if (!response || !response.data) {
        throw new NotFoundException('Không tìm thấy danh sách quận/huyện.');
      }

      return response.data; // Trả về danh sách quận/huyện
    } catch (error) {
      throw new NotFoundException('Lỗi khi lấy danh sách các quận/huyện.');
    }
  }

  // Lấy danh sách các phường/xã theo mã quận/huyện
  async getWardsOpenAPI(districtCode: string) {
    try {
      const response: AxiosResponse<any, any, {}> | undefined = await this.httpService
        .get(`${this.openApiProvincesBaseUrl}/wards/${districtCode}`)
        .toPromise();

      if (!response || !response.data) {
        throw new NotFoundException('Không tìm thấy danh sách phường/xã.');
      }

      return response.data; // Trả về danh sách phường/xã
    } catch (error) {
      throw new NotFoundException('Lỗi khi lấy danh sách các phường/xã.');
    }
  }

  
}
