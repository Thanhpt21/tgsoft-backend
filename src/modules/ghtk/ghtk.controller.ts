import { Controller, Post, Body, Get, Query, Param, UseGuards, Put, Request } from '@nestjs/common';
import { GhtkService } from './ghtk.service';
import { CalculateFeeDto } from './dto/calculate-fee.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateGHTKConfigDto } from './dto/create-ghtk-config.dto';

@Controller('ghtk') // Base route for all GHTK API endpoints
export class GhtkController {
  constructor(private readonly ghtkService: GhtkService) {}

  // Calculate shipping fee
  @Post('calculate-fee')
  async calculateFee(@Body() calculateFeeDto: CalculateFeeDto, @Request() req) {
    const fee = await this.ghtkService.calculateShippingFee(calculateFeeDto);
    return { success: true, fee };
  }


  // Create a new order on GHTK
  @Post('create-order')
  async createOrder(@Body('orderId') orderId: number) {
    const ghtkOrderDetails = await this.ghtkService.createGHTKOrder(orderId);
    return {
      success: true,
      message: 'Order has been successfully created on GHTK.',
      ghtkOrderDetails,
    };
  }

  // Fetch list of provinces
  @Get('provinces')
  async getProvinces() {
    return this.ghtkService.getProvincesOpenAPI();
  }

  // Fetch list of districts based on province code
  @Get('districts/:provinceCode')
  async getDistricts(@Param('provinceCode') provinceCode: string) {
    return this.ghtkService.getDistrictsOpenAPI(provinceCode);
  }

  // Fetch list of wards based on district code
  @Get('wards/:districtCode')
  async getWards(@Param('districtCode') districtCode: string) {
    return this.ghtkService.getWardsOpenAPI(districtCode);
  }

 

}
