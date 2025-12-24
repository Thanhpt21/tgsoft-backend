import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from 'src/modules/users/dto/user-response.dto';
import { PrismaService } from 'prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import * as jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Đăng ký
  async register(dto: RegisterDto, tenantId?: number) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) throw new BadRequestException('Email đã được sử dụng');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        tenantId: tenantId ?? null, 
      },
    });

    const token = await this.signToken(user.id, user.email, user.role, user.tenantId);

    return {
      user: new UserResponseDto(user),
      access_token: token,
    };
  }

  async login(dto: LoginDto, tenantIdFromHeader?: number) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Email không tồn tại');

    if (!user.password) {
      throw new UnauthorizedException('Tài khoản này không thể đăng nhập bằng mật khẩu');
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) throw new UnauthorizedException('Sai mật khẩu');

    const tenantCheck = tenantIdFromHeader ?? Number(process.env.NEXT_PUBLIC_TENANT_ID);

    if (user.tenantId && user.tenantId !== tenantCheck) {
      throw new UnauthorizedException(
        `Tài khoản không thuộc cửa hàng này, không thể đăng nhập vào cửa hàng`
      );
    }

    const token = await this.signToken(user.id, user.email, user.role, user.tenantId);
    return { user: new UserResponseDto(user), access_token: token };
  }

  private async signToken(userId: number, email: string, role: string, tenantId?: number | null) {
    const payload = { sub: userId, email, role, tenantId  };
    return this.jwtService.signAsync(payload);
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password || '');
    if (!isMatch) throw new BadRequestException('Mật khẩu hiện tại không chính xác');

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashed },
    });

    return { message: 'Đổi mật khẩu thành công' };
  }

  // 🟣 RESET PASSWORD
  async resetPassword(dto: ResetPasswordDto) {
    let payload: any;
    const secret = process.env.JWT_SECRET || 'F3!r7@xP9#sLq2ZmV&bNcT*UYj8dWvHr';
    try {
      payload = jwt.verify(dto.token,secret);
    } catch (error) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user || user.resetToken !== dto.token) {
      throw new BadRequestException('Token không hợp lệ hoặc đã được sử dụng');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { email: user.email },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Đặt lại mật khẩu thành công' };
  }

    // 🆕 Hàm dùng cho OAuth2 (Google / Facebook)
  async validateOAuthUser(oauthUser: any) {
    const { email, name, photo, provider } = oauthUser;

    // Kiểm tra user có tồn tại chưa
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Nếu chưa có thì tạo mới
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          avatar: photo,
          isActive: true,
          role: 'user',
          type_account: provider, // ví dụ: 'google' hoặc 'facebook'
        },
      });
    }

    // Trả về JWT accessToken
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return { user, access_token };
  }
}
