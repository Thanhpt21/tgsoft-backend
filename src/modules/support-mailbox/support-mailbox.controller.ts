import { 
  Controller, Get, Post, Put, Delete, Body, Param, 
  ParseIntPipe, UseGuards, Query 
} from '@nestjs/common';
import { SupportMailboxService } from './support-mailbox.service';
import { CreateSupportMailboxDto } from './dto/create-support-mailbox.dto';
import { UpdateSupportMailboxDto } from './dto/update-support-mailbox.dto';
import { AdminReplyDto } from './dto/admin-reply.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('support-mailbox')
export class SupportMailboxController {
  constructor(private readonly supportMailboxService: SupportMailboxService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('create_support_mailbox')
  async create(@Body() dto: CreateSupportMailboxDto) {
    return this.supportMailboxService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('read_support_mailbox')
  async getSupportMailboxes(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
    @Query('status') status?: string,
  ) {
    return this.supportMailboxService.getSupportMailboxes(page, limit, search, status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('get_a_support_mailbox')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.supportMailboxService.getById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('update_support_mailbox')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupportMailboxDto,
  ) {
    return this.supportMailboxService.update(id, dto);
  }

  @Post(':id/admin-reply')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('admin_reply_support_mailbox')
  async adminReply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminReplyDto,
  ) {
    return this.supportMailboxService.adminReply(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('delete_support_mailbox')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.supportMailboxService.delete(id);
  }
}