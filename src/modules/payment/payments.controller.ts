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
  @UseGuards(TenantGuard)
  createVnpayPayment(
    @Query('orderId') orderIdStr: string,
    @Query('amount') amountStr: string,
    @Query('returnUrl') returnUrl: string,
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

    const url = this.vnpayService.createPaymentUrl(orderId, amount, returnUrl);
    
    return { success: true, url };
  }

  // Callback từ VNPay sau khi thanh toán
  @Get('vnpay/callback')
  async handleVnpayReturn(@Query() query: any, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const result = this.vnpayService.verifyReturnUrl(query);

    // Kiểm tra tính hợp lệ của chữ ký
    if (!result.isValid) {
      return res.redirect(`${frontendUrl}/xac-nhan-don-hang?status=failed&message=Chữ ký không hợp lệ`);
    }

    // Kiểm tra mã phản hồi của giao dịch
    if (result.responseCode === '00') {
      const orderId = parseInt(result.orderId, 10);
      if (isNaN(orderId)) {
        return res.redirect(`${frontendUrl}/xac-nhan-don-hang?status=failed&message=OrderId không hợp lệ`);
      }

      // Lấy tenantId từ đơn hàng
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { tenantId: true },
      });

      if (!order) {
        return res.redirect(`${frontendUrl}/xac-nhan-don-hang?status=failed&message=Không tìm thấy order`);
      }

      // Gọi service để cập nhật thông tin thanh toán
      await this.paymentsService.createOrUpdateFromVnpay({
        ...result,
        orderId: result.orderId,
        tenantId: order.tenantId,
      });

      // Redirect tới trang kết quả thanh toán với các tham số cần thiết
      return res.redirect(`${frontendUrl}/xac-nhan-don-hang?status=success&orderId=${orderId}&amount=${result.amount}&transactionNo=${result.transactionNo}&payDate=${result.payDate}&bankCode=${result.bankCode}`);
    }

    // Nếu thanh toán thất bại
    return res.redirect(`${frontendUrl}/xac-nhan-don-hang?status=failed&message=Thanh toán thất bại`);
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