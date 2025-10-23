import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards, Put } from '@nestjs/common';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { MergeCartDto } from './dto/merge-cart.dto';
import { CartService } from './cart.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { TenantGuard } from 'src/common/guards/tenant.guard';
// import { AuthGuard } from 'src/auth/auth.guard'; // Nếu dùng auth

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, TenantGuard)
  getMyCart(@Req() req: any) {
    const userId = req.user.id;
    return this.cartService.getCartByUser(userId);
  }

  @Post('items')
  @UseGuards(JwtAuthGuard, TenantGuard)
  addItem(@Req() req: any, @Body() dto: AddCartItemDto) {
    const userId = req.user.id;
    return this.cartService.addItemToCart(userId, dto);
  }

  @Put('items/:id')
   @UseGuards(JwtAuthGuard, TenantGuard)
  updateItem(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCartItemDto) {
    const userId = req.user.id;
    return this.cartService.updateCartItem(userId, +id, dto);
  }

  @Delete('items/:id')
  @UseGuards(JwtAuthGuard, TenantGuard)
  removeItem(@Req() req: any, @Param('id') id: string) {
      const userId = req.user.id;
    return this.cartService.removeCartItem(userId, +id);
  }

  @Post('merge')
  mergeCart(@Req() req: any, @Body() dto: MergeCartDto) {
    const userId = req.user.id;
    return this.cartService.mergeClientCart(userId, dto);
  }

  // @Post('checkout')
  // @UseGuards(JwtAuthGuard, TenantGuard)
  // async checkout(@Req() req: any) {
  //   const userId = req.user.id;
  //   return this.cartService.checkoutCartToOrder(userId);
  // }
}
