import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Body,
  Param,
  BadRequestException,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { GetMessagesDto, MigrateMessagesDto } from './dto/send-message.dto';
import { AiService } from './ai/ai.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService, private readonly aiService: AiService) {}

  // ============================================
  // USER ENDPOINTS
  // ============================================

  /**
   * Lấy messages cho user/guest
   * Query: conversationId, sessionId, hoặc userId
   */
  @Get('messages')
  async getMessages(@Query() query: GetMessagesDto) {
    const { conversationId, sessionId, userId } = query;

    
    if (userId) {
      const userIdNum = parseInt(userId as any, 10);
      
      if (isNaN(userIdNum)) {
        throw new BadRequestException('userId must be a valid number');
      }
      
      const conversations = await this.chatService.getUserConversations(userIdNum);
      return { conversations };
    }

    // Lấy từ DB nếu có conversationId
    if (conversationId) {
      const messages = await this.chatService.getConversationMessages(conversationId);
      return { messages };
    }

    // Lấy từ Redis nếu có sessionId
    if (sessionId) {
      const messages = await this.chatService.getSessionMessages(sessionId);
      return { messages };
    }

    throw new BadRequestException('Missing required parameters');
  }

  /**
   * Lấy guest messages trước khi login
   */
  @Get('guest-messages')
  async getGuestMessages(@Query('sessionId') sessionId: string) {
    if (!sessionId) {
      throw new BadRequestException('sessionId is required');
    }

    const conversations = await this.chatService.getGuestMessagesBeforeLogin(sessionId);
    return { conversations };
  }

  /**
   * Migrate messages từ guest sang user
   */
  @Post('migrate')
  async migrateMessages(@Body() body: MigrateMessagesDto) {
    const { sessionId, userId, tenantId } = body;

    if (!sessionId || !userId || !tenantId) {
      throw new BadRequestException('Missing required fields');
    }

    return this.chatService.migrateMessagesToDb(sessionId, userId, tenantId);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  /**
   * [ADMIN] Lấy tất cả conversations
   * Query params:
   * - tenantId (optional): Filter theo tenant
   * - status (optional): Filter theo status (ACTIVE, CLOSED)
   * - page, limit: Pagination
   */
  @Get('admin/conversations')
  async getAllConversations(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const skip = (pageNum - 1) * limitNum;

    const conversations = await this.chatService.getAllConversations({
      tenantId: tenantId ? parseInt(tenantId, 10) : undefined,
      status,
      skip,
      take: limitNum,
    });

    return conversations;
  }

  /**
   * [ADMIN] Lấy chi tiết 1 conversation
   */
  @Get('admin/conversations/:id')
  async getConversationById(
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    const conversation = await this.chatService.getConversationById(conversationId);
    
    if (!conversation) {
      throw new BadRequestException('Conversation not found');
    }

    return { conversation };
  }

  /**
   * [ADMIN] Lấy messages của conversation
   */
  @Get('admin/conversations/:id/messages')
  async getConversationMessages(
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    const messages = await this.chatService.getConversationMessages(conversationId);
    return { messages };
  }

  /**
   * [ADMIN] Mark messages as read
   */
  @Patch('admin/conversations/:id/mark-read')
  async markMessagesAsRead(
    @Param('id', ParseIntPipe) conversationId: number,
    @Body('adminId', ParseIntPipe) adminId: number,
  ) {
    if (!adminId) {
      throw new BadRequestException('adminId is required');
    }

    await this.chatService.markMessagesAsRead(conversationId, adminId);
    return { success: true, message: 'Messages marked as read' };
  }

  /**
   * [ADMIN] Lấy số lượng tin nhắn chưa đọc
   */
  @Get('admin/unread-count')
  async getUnreadCount(@Query('tenantId') tenantId?: string) {
    const count = await this.chatService.getUnreadMessagesCount(
      tenantId ? parseInt(tenantId, 10) : undefined
    );
    return { count };
  }

  /**
   * [ADMIN] Close/Archive conversation
   */
  @Patch('admin/conversations/:id/close')
  async closeConversation(
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    const conversation = await this.chatService.closeConversation(conversationId);
    return { success: true, conversation };
  }

  /**
   * [ADMIN] Reopen conversation
   */
  @Patch('admin/conversations/:id/reopen')
  async reopenConversation(
    @Param('id', ParseIntPipe) conversationId: number,
  ) {
    const conversation = await this.chatService.reopenConversation(conversationId);
    return { success: true, conversation };
  }

  /**
   * [ADMIN] Assign conversation to admin
   */
  @Patch('admin/conversations/:id/assign')
  async assignConversation(
    @Param('id', ParseIntPipe) conversationId: number,
    @Body('adminId', ParseIntPipe) adminId: number,
  ) {
    if (!adminId) {
      throw new BadRequestException('adminId is required');
    }

    const conversation = await this.chatService.assignConversation(
      conversationId, 
      adminId
    );
    return { success: true, conversation };
  }

  /**
   * [ADMIN] Get conversations assigned to specific admin
   */
  @Get('admin/my-conversations')
  async getAdminConversations(
    @Query('adminId', ParseIntPipe) adminId: number,
  ) {
    if (!adminId) {
      throw new BadRequestException('adminId is required');
    }

    const conversations = await this.chatService.getAdminConversations(adminId);
    return { conversations };
  }

  /**
   * [ADMIN] Search conversations
   */
  @Get('admin/search')
  async searchConversations(
    @Query('keyword') keyword: string,
    @Query('tenantId') tenantId?: string,
  ) {
    if (!keyword || keyword.trim().length === 0) {
      throw new BadRequestException('keyword is required');
    }

    const conversations = await this.chatService.searchConversations(
      keyword,
      tenantId ? parseInt(tenantId, 10) : undefined
    );
    return { conversations };
  }

  /**
   * [ADMIN] Get statistics
   */
  @Get('admin/stats')
  async getStatistics(@Query('tenantId') tenantId?: string) {
    const stats = await this.chatService.getConversationStats(
      tenantId ? parseInt(tenantId, 10) : undefined
    );
    return { stats };
  }

  @Get('conversation-ids')
  async getConversationIds(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('tenantId', ParseIntPipe) tenantId?: number,
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const conversationIds = await this.chatService.getConversationIdsByUserId(userId, tenantId);

    return { conversationIds };
  }

 @Get(':tenantId/ai-enabled')
  async isAiChatEnabled(@Param('tenantId', ParseIntPipe) tenantId: number) {
    const enabled = await this.aiService.isAiChatEnabled(tenantId);
    return { tenantId, aiChatEnabled: enabled };
  }



  @Put(':tenantId/ai-enabled')
  @UseGuards(JwtAuthGuard)
  async setAiChatEnabled(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body('aiChatEnabled') aiChatEnabled: boolean,
  ) {
    if (aiChatEnabled === undefined || aiChatEnabled === null) {
      throw new BadRequestException('aiChatEnabled field is required');
    }

    const result = await this.aiService.setAiChatEnabled(tenantId, aiChatEnabled);
    return { tenantId, aiChatEnabled: result };
  }
}