// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '../upload/upload.service';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';


@Controller('users')

export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly uploadService: UploadService,
  ) {}
  

  // Tạo user mới
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('create_users')
  @UseInterceptors(FileInterceptor('avatar'))
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return await this.usersService.createUser(createUserDto, file);
  }

  @Get('all/list')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('read_all_users')
  async getAllUsers(@Query('search') search: string = '') {
    return await this.usersService.getAllUsers(search);
  }

  // Lấy danh sách user, có phân trang và search
  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('read_users')
  async getUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
  ) {
    return await this.usersService.getUsers(+page, +limit, search);
  }

  // Lấy danh sách user CÓ ROLE, có phân trang và search
  @Get('with-role')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('read_users')
  async getUsersWithRole(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
    @Query('roleName') roleName?: string,
  ) {
    return await this.usersService.getUsersWithRole(+page, +limit, search, roleName);
  }

  @Get('admin-shop/list')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('read_users')
  async getAdminShopUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
  ) {
    return await this.usersService.getAdminShopUsers(+page, +limit, search);
  }


  @Put(':id/toggle-chat')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('update_users')
  async toggleUserChat(
    @Param('id') userId: string,
    @Body() body: { enabled: boolean }
  ) {
    return await this.usersService.toggleUserChat(+userId, body.enabled);
  }

  @Get(':id/chat-status')
  @UseGuards(JwtAuthGuard)
  async getUserChatStatus(@Param('id') userId: string) {
    return await this.usersService.getUserChatStatus(+userId);
  }
  
  @Put(':id/tag')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('update_users')
  async updateUserTag(
    @Param('id') userId: string,
    @Body() body: { tag: string | null }
  ) {
    return await this.usersService.updateUserTag(+userId, body.tag);
  }



  
  @Get('tenant/admin-shop')
  async getTenantAdminShop() {
    return this.usersService.getTenantAdminShop();
  }

  @Get('tenant/admin-shop/tokens')
  async getTenantAdminShopTokens() {
    return this.usersService.getTenantAdminShopTokens();
  }

  @Put('tenant/admin-shop/tokens')
  async updateTenantAdminShopTokens(@Body() body: { tokensUsed: number }) {
    return this.usersService.updateTenantAdminShopTokens(body.tokensUsed);
  }

  @Post('tenant/admin-shop/check-tokens')
  async checkTenantAdminShopTokens(@Body() body: { tokensNeeded: number }) {
    return this.usersService.checkTenantAdminShopTokens(body.tokensNeeded);
  }

  // Lấy user theo id
  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('get_a_users')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.getUserById(id);
  }

  // Cập nhật user
  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('update_users')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return await this.usersService.updateUser(id, updateUserDto, file);
  }


  // Xoá user (chỉ admin mới được phép)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('delete_users')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.deleteUser(id);
  }
}
