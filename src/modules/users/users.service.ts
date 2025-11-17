// src/users/users.service.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { Prisma } from '@prisma/client';
import { UploadService } from '../upload/upload.service';
import { REQUEST } from '@nestjs/core';
import { TenantAwareService } from 'src/common/services/tenant-aware.service';

@Injectable()
export class UsersService extends TenantAwareService {
  constructor(
    protected prisma: PrismaService,
    @Inject(REQUEST) protected readonly request: Request | any,
    private uploadService: UploadService,
  ) {
    super(prisma, request);
  }

  async createUser(createUserDto: CreateUserDto, file?: Express.Multer.File) {
    // Mã hóa password trước khi lưu
    const hashedPassword = createUserDto.password
      ? await bcrypt.hash(createUserDto.password, 10)
      : null;

  
    const role = 'user';
    
    // Upload file nếu có
    let avatar: string | null = null;
    if (file) {
      avatar = await this.uploadService.uploadLocalImage(file);
    }


    const userData = {
      ...createUserDto,
      password: hashedPassword,
      role, 
      avatar,
    };


    // Nếu là admin thì không cần tenantId
    if (this.request.user?.role === 'admin') {
      delete userData.tenantId;  // Bỏ tenantId nếu là admin
    } else {
      userData.tenantId = this.tenantId;  // Gán tenantId nếu không phải admin
    }


    // Tạo người dùng trong cơ sở dữ liệu
    const user = await this.prisma.user.create({
      data: userData,
    });

    return {
      success: true,
      message: 'Tạo người dùng thành công',
      data: new UserResponseDto(user),
    };
  }

  


async getUsers(page = 1, limit = 10, search = '') {
  const skip = (page - 1) * limit;

  const userRole = this.request.user?.role;
  let where: Prisma.UserWhereInput = {};

  if (userRole === 'admin') {
    where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
              { email: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            ],
          }
        : {}),
    };
  } else {
    where = {
      tenantId: this.tenantId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
              { email: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
            ],
          }
        : {}),
    };
  }

  const [users, total] = await this.prisma.$transaction([
    this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        isActive: true,
        type_account: true,
        tokenAI: true,
        role: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        // Lấy chatConversations và thêm conversationId
        chatConversations: {
          select: {
            id: true,  // Chỉ lấy ID của cuộc trò chuyện (conversationId)
          },
          take: 1,  // Chỉ lấy một cuộc trò chuyện gần nhất, bạn có thể thay đổi nếu cần
        },
      },
    }),
    this.prisma.user.count({ where }),
  ]);

  // Xử lý dữ liệu và thêm conversationId vào response
  const usersWithConversation = users.map((user) => {
    // Kiểm tra xem người dùng có chatConversations không
    const conversationId = user.chatConversations.length > 0 ? user.chatConversations[0].id : null;
    
    return {
      ...user,
      conversationId,  // Thêm conversationId vào dữ liệu user
    };
  });

  return {
    success: true,
    message: 'Lấy danh sách người dùng thành công',
    data: {
      data: usersWithConversation,  // Dữ liệu đã có conversationId
      total,
      page,
      pageCount: Math.ceil(total / limit),
    },
  };
}


  async getAllUsers(search = '') {
    const userRole = this.request.user?.role;
    let where: Prisma.UserWhereInput = {};

    if (userRole === 'admin') {
      where = {
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                { email: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
              ],
            }
          : {}),
      };
    } else {
      where = {
        tenantId: this.tenantId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
                { email: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
              ],
            }
          : {}),
      };
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        isActive: true,
        tokenAI: true,
        type_account: true,
        role: true,
         tenantId: true, 
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      message: 'Lấy tất cả người dùng thành công',
      data: users,
    };
  }




  async getUserById(id: number) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
      },
    });

    if (!user) throw new NotFoundException('User not found in this tenant');

    return {
      success: true,
      message: 'Lấy thông tin người dùng thành công',
      data: new UserResponseDto(user),
    };
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
    file?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const data: any = { ...updateUserDto };

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (file) {
      if (user.avatar) {
        await this.uploadService.deleteLocalImage(user.avatar);
      }

      const imageUrl = await this.uploadService.uploadLocalImage(file);
      data.avatar = imageUrl;
    }

    if (updateUserDto.token !== undefined) {
      data.token = updateUserDto.token;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });

    return {
      success: true,
      message: 'Cập nhật người dùng thành công',
      data: new UserResponseDto(updatedUser),
    };
  }

  async deleteUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id } });

    return {
      success: true,
      message: 'Xóa người dùng thành công',
      data: null,
    };
  }

  // Thêm vào UsersService trong src/users/users.service.ts

async getTenantAdminShop(tenantId?: number) {
  const targetTenantId = tenantId || this.tenantId;
  
  const adminShopUser = await this.prisma.user.findFirst({
    where: {
      role: 'adminshop',
      tenantId: targetTenantId
    },
    select: { 
      id: true,
      name: true,
      email: true,
      tokenAI: true,
      token: true,
      role: true,
      tenantId: true,
      isActive: true
    }
  });

  if (!adminShopUser) {
    throw new NotFoundException(`Admin shop not found for tenant ${targetTenantId}`);
  }

  return {
    success: true,
    message: 'Lấy thông tin admin shop thành công',
    data: adminShopUser
  };
}

async updateTenantAdminShopTokens(tokensUsed: number, tenantId?: number) {
  const targetTenantId = tenantId || this.tenantId;
  
  // Tìm admin shop của tenant
  const adminShopUser = await this.prisma.user.findFirst({
    where: {
      role: 'adminshop',
      tenantId: targetTenantId
    },
    select: { 
      id: true,
      tokenAI: true,
      name: true
    }
  });

  if (!adminShopUser) {
    throw new NotFoundException(`Admin shop not found for tenant ${targetTenantId}`);
  }

  // Tính toán token mới (không để âm)
  const newTokenBalance = Math.max(0, adminShopUser.tokenAI - tokensUsed);

  console.log(`🔄 Updating tokens for admin shop ${adminShopUser.id}: ${adminShopUser.tokenAI} - ${tokensUsed} = ${newTokenBalance}`);

  // Update token của admin shop
  const updatedAdminShop = await this.prisma.user.update({
    where: { id: adminShopUser.id },
    data: { tokenAI: newTokenBalance },
    select: { 
      id: true,
      tokenAI: true,
      name: true,
      email: true,
      role: true,
      tenantId: true
    }
  });

  return {
    success: true,
    message: `Đã trừ ${tokensUsed} tokens từ admin shop. Số dư còn lại: ${newTokenBalance}`,
    data: updatedAdminShop
  };
}

async getTenantAdminShopTokens(tenantId?: number) {
  const targetTenantId = tenantId || this.tenantId;
  
  const adminShopUser = await this.prisma.user.findFirst({
    where: {
      role: 'adminshop',
      tenantId: targetTenantId
    },
    select: { 
      id: true,
      name: true,
      email: true,
      tokenAI: true,
      token: true,
      role: true,
      tenantId: true
    }
  });

  if (!adminShopUser) {
    throw new NotFoundException(`Admin shop not found for tenant ${targetTenantId}`);
  }

  return {
    success: true,
    message: 'Lấy thông tin token của admin shop thành công',
    data: adminShopUser
  };
}

// Hàm kiểm tra xem admin shop có đủ token không
async checkTenantAdminShopTokens(tokensNeeded: number, tenantId?: number) {
  const targetTenantId = tenantId || this.tenantId;
  
  const adminShopUser = await this.prisma.user.findFirst({
    where: {
      role: 'adminshop',
      tenantId: targetTenantId
    },
    select: { 
      id: true,
      name: true,
      tokenAI: true
    }
  });

  if (!adminShopUser) {
    throw new NotFoundException(`Admin shop not found for tenant ${targetTenantId}`);
  }

  const hasEnoughTokens = adminShopUser.tokenAI >= tokensNeeded;

  return {
    success: true,
    message: hasEnoughTokens ? 'Đủ token' : 'Không đủ token',
    data: {
      hasEnoughTokens,
      currentTokens: adminShopUser.tokenAI,
      tokensNeeded,
      remaining: adminShopUser.tokenAI - tokensNeeded
    }
  };
}
}
