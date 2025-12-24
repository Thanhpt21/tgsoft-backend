// payments.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  BadRequestException,
  ValidationPipe,
  Res,
  Headers, // 🔥 THÊM Headers
} from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { VnpayService } from './vnpay.service';
import { VnpayPaymentQueryDto } from './dto/vnpay-payment.dto';
import { TenantGuard } from 'src/common/guards/tenant.guard';
import { PrismaService } from 'prisma/prisma.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly vnpayService: VnpayService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Get('vnpay')
  createVnpayPayment(
    @Query('orderId') orderIdStr: string,
    @Query('amount') amountStr: string,
    @Query('returnUrl') returnUrl: string,
    @Headers() headers: any, // 🔥 NHẬN headers từ frontend
  ) {
    if (!orderIdStr || !amountStr || !returnUrl) {
      throw new BadRequestException('Thiếu tham số bắt buộc');
    }

    const orderId = parseInt(orderIdStr, 10);
    const amount = parseInt(amountStr, 10);

    if (isNaN(orderId) || isNaN(amount)) {
      throw new BadRequestException('orderId và amount phải là số');
    }

    if (orderId <= 0 || amount < 1000) {
      throw new BadRequestException('orderId phải > 0, amount phải >= 1000');
    }

    try {
      new URL(returnUrl);
    } catch {
      throw new BadRequestException('returnUrl không hợp lệ');
    }

    // 🔥 LẤY config từ headers frontend gửi lên
    const vnpayConfig = {
      tmnCode: headers['vnp-tmn-code'] || process.env.VNP_TMN_CODE,
      secretKey: headers['vnp-secret'] || process.env.VNP_SECRET,
      vnpUrl: headers['vnp-api-url'] || process.env.VNP_API_URL,
    };

    // 🔥 TRUYỀN config vào service
    const url = this.vnpayService.createPaymentUrl(
      orderId, 
      amount, 
      returnUrl,
      vnpayConfig // 🔥 TRUYỀN config
    );
    
    return { success: true, url };
  }

  // Callback từ VNPay sau khi thanh toán
  @Get('vnpay/callback')
    async handleVnpayReturn(
      @Query() query: any,
      @Res() res: Response,
      @Headers() headers: any,
    ) {
      const vnpayConfig = {
        tmnCode: headers['vnp-tmn-code'] || process.env.VNP_TMN_CODE,
        secretKey: headers['vnp-secret'] || process.env.VNP_SECRET,
        vnpUrl: headers['vnp-api-url'] || process.env.VNP_API_URL,
      };

      const result = this.vnpayService.verifyReturnUrl(query, vnpayConfig);

      // Lấy returnUrl từ query param mà VNPay mang theo
      const rawReturnUrl = query.returnUrl as string;
      const returnUrl = rawReturnUrl ? decodeURIComponent(rawReturnUrl) : '';

      const orderId = parseInt(result.orderId, 10);

      // Chữ ký không hợp lệ
      if (!result.isValid) {
        return res.redirect(`${returnUrl}?status=failed&message=Chữ ký không hợp lệ`);
      }

      if (result.responseCode === '00') {
        // Thanh toán thành công
        const order = await this.prisma.order.findUnique({
          where: { id: orderId },
          select: { tenantId: true },
        });

        if (!order) {
          return res.redirect(`${returnUrl}?status=failed&message=Không tìm thấy đơn hàng`);
        }

        await this.paymentsService.createOrUpdateFromVnpay({
          ...result,
          orderId: result.orderId,
          tenantId: order.tenantId,
        });

        return res.redirect(
          `${returnUrl}?status=success&orderId=${orderId}&amount=${result.amount}&transactionNo=${result.transactionNo}&payDate=${result.payDate}&bankCode=${result.bankCode}`,
        );
      }

      // Thanh toán thất bại
      return res.redirect(`${returnUrl}?status=failed&message=Thanh toán thất bại (mã: ${result.responseCode})`);
    }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('orderId') orderId?: number,
    @Query('status') status?: string,
    @Query('methodId') methodId?: number,
    @Query('search') search: string = '',
  ) {
    return this.paymentsService.getPayments(
      +page,
      +limit,
      orderId ? +orderId : undefined,
      status,
      methodId ? +methodId : undefined,
      search,
    );
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    return this.paymentsService.getPaymentStats();
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async getByOrderId(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.paymentsService.getPaymentsByOrderId(orderId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.getPaymentById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.paymentsService.updatePayment(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.deletePayment(id);
  }
}