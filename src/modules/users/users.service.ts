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
      chatEnabled: true,
      tag: null,
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

  // Phân quyền - chỉ admin shop mới được xem
  if (userRole === 'adminshop') {
    where = {
      tenantId: this.tenantId,
      // CHỈ lấy users CHƯA CÓ ROLE trong tenant này
      userTenantRoles: {
        none: {
          tenantId: this.tenantId
        }
      },
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };
  } else {
    throw new Error('Unauthorized');
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
        chatEnabled: true, 
        tag: true,      
        chatConversations: {
          select: { id: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        orders: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        userTenantRoles: {
          where: {
            tenantId: this.tenantId
          },
          select: {
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            tenantId: true
          }
        }
      },
    }),
    this.prisma.user.count({ where }),
  ]);

  // Lấy thống kê
  const userIds = users.map(user => user.id);
  
  const [messageCounts, orderCounts] = await Promise.all([
    this.prisma.chatMessage.groupBy({
      by: ['conversationId'],
      where: {
        conversation: {
          userId: { in: userIds }
        }
      },
      _count: { id: true }
    }),
    
    this.prisma.order.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds }
      },
      _count: { id: true }
    })
  ]);

  // Gộp dữ liệu
  const usersWithStats = users.map((user) => {
    const conversationId = user.chatConversations.length > 0 ? user.chatConversations[0].id : null;
    
    const userMessageCount = messageCounts
      .filter(msg => user.chatConversations.some(conv => conv.id === msg.conversationId))
      .reduce((total, msg) => total + msg._count.id, 0);

    const userOrderCount = orderCounts.find(order => order.userId === user.id)?._count.id || 0;

    const totalOrderValue = user.orders.reduce((total, order) => {
      return total + order.totalAmount;
    }, 0);

    const userRoles = user.userTenantRoles.map(utr => utr.role);

    return {
      ...user,
      conversationId,
      stats: {
        totalMessages: userMessageCount,
        totalOrders: userOrderCount,
        totalOrderValue,
        recentOrdersCount: user.orders.length,
        avgOrderValue: user.orders.length > 0 ? Math.round(totalOrderValue / user.orders.length) : 0
      },
      recentOrders: user.orders.map(order => ({
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt
      })),
      roles: userRoles,
      hasRole: false // Luôn là false vì đây là API lấy users chưa có role
    };
  });

  return {
    success: true,
    message: 'Lấy danh sách người dùng chưa có role thành công',
    data: {
      data: usersWithStats,
      total,
      page,
      pageCount: Math.ceil(total / limit),
    },
  };
}

async getUsersWithRole(page = 1, limit = 10, search = '', roleName?: string) {
  const skip = (page - 1) * limit;

  const userRole = this.request.user?.role;
  let where: Prisma.UserWhereInput = {};

  // Phân quyền - chỉ admin shop mới được xem
  if (userRole === 'adminshop') {
    where = {
      tenantId: this.tenantId,
      // CHỈ lấy users CÓ ROLE trong tenant này
      userTenantRoles: {
        some: {
          tenantId: this.tenantId
        }
      },
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };
  } else {
    throw new Error('Unauthorized');
  }

  // Nếu có filter theo role name cụ thể
  if (roleName) {
    where = {
      ...where,
      userTenantRoles: {
        some: {
          tenantId: this.tenantId,
          role: {
            name: roleName
          }
        }
      }
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
        chatEnabled: true, 
        tag: true,      
        chatConversations: {
          select: { id: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        orders: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        userTenantRoles: {
          where: {
            tenantId: this.tenantId
          },
          select: {
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            tenantId: true
          }
        }
      },
    }),
    this.prisma.user.count({ where }),
  ]);

  // Lấy thống kê
  const userIds = users.map(user => user.id);
  
  const [messageCounts, orderCounts] = await Promise.all([
    this.prisma.chatMessage.groupBy({
      by: ['conversationId'],
      where: {
        conversation: {
          userId: { in: userIds }
        }
      },
      _count: { id: true }
    }),
    
    this.prisma.order.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds }
      },
      _count: { id: true }
    })
  ]);

  // Gộp dữ liệu
  const usersWithStats = users.map((user) => {
    const conversationId = user.chatConversations.length > 0 ? user.chatConversations[0].id : null;
    
    const userMessageCount = messageCounts
      .filter(msg => user.chatConversations.some(conv => conv.id === msg.conversationId))
      .reduce((total, msg) => total + msg._count.id, 0);

    const userOrderCount = orderCounts.find(order => order.userId === user.id)?._count.id || 0;

    const totalOrderValue = user.orders.reduce((total, order) => {
      return total + order.totalAmount;
    }, 0);

    const userRoles = user.userTenantRoles.map(utr => utr.role);

    return {
      ...user,
      conversationId,
      stats: {
        totalMessages: userMessageCount,
        totalOrders: userOrderCount,
        totalOrderValue,
        recentOrdersCount: user.orders.length,
        avgOrderValue: user.orders.length > 0 ? Math.round(totalOrderValue / user.orders.length) : 0
      },
      recentOrders: user.orders.map(order => ({
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt
      })),
      roles: userRoles,
      hasRole: true // Luôn là true vì đây là API lấy users có role
    };
  });

  return {
    success: true,
    message: 'Lấy danh sách người dùng có role thành công',
    data: {
      data: usersWithStats,
      total,
      page,
      pageCount: Math.ceil(total / limit),
      filter: roleName || 'all-roles'
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

async toggleUserChat(userId: number, enabled: boolean) {
  const user = await this.prisma.user.findFirst({
    where: {
      id: userId,
      tenantId: this.tenantId // Chỉ admin shop mới được toggle users trong tenant của họ
    }
  });

  if (!user) {
    throw new NotFoundException('User not found in this tenant');
  }

  const updatedUser = await this.prisma.user.update({
    where: { id: userId },
    data: { chatEnabled: enabled }
  });

  return {
    success: true,
    message: `Đã ${enabled ? 'bật' : 'tắt'} chat cho người dùng ${user.name}`,
    data: new UserResponseDto(updatedUser)
  };
}

async getUserChatStatus(userId: number) {
  const user = await this.prisma.user.findFirst({
    where: {
      id: userId,
      tenantId: this.tenantId
    },
    select: {
      id: true,
      name: true,
      email: true,
      chatEnabled: true
    }
  });

  if (!user) {
    throw new NotFoundException('User not found in this tenant');
  }

  return {
    success: true,
    message: 'Lấy trạng thái chat thành công',
    data: user
  };
}

async updateUserTag(userId: number, tag: string | null) {
  const user = await this.prisma.user.findFirst({
    where: {
      id: userId,
      tenantId: this.tenantId
    }
  });

  if (!user) {
    throw new NotFoundException('User not found in this tenant');
  }

  const updatedUser = await this.prisma.user.update({
    where: { id: userId },
    data: { tag: tag as any } // Ép kiểu sang UserTag enum
  });

  return {
    success: true,
    message: tag ? `Đã gán tag "${tag}" cho người dùng` : 'Đã xóa tag của người dùng',
    data: new UserResponseDto(updatedUser)
  };
}

async getAdminShopUsers(
  page: number = 1, 
  limit: number = 10, 
  search: string = ''
) {
  const skip = (page - 1) * limit;

  const where: any = {
    role: 'adminshop'
  };

  // Thêm search nếu có
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { tenant: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  const [adminShopUsers, total] = await this.prisma.$transaction([
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
         defaultTokens: true, 
        fixedTokens: true,   
        token: true,
        role: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        chatEnabled: true,
        tag: true,
        tenant: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        },
      }
    }),
    this.prisma.user.count({ where })
  ]);

  if (adminShopUsers.length === 0) {
    throw new NotFoundException('No admin shop users found');
  }

  return {
    success: true,
    message: `Lấy danh sách admin shop thành công`,
    data: {
      data: adminShopUsers,
      total,
      page,
      pageCount: Math.ceil(total / limit),
    }
  };
}

}
