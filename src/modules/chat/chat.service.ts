import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ChatRedisService, ChatMessageRedis } from './redis/chat-redis.service';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from 'prisma/prisma.service';
import { ChatConversation } from '@prisma/client';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private chatRedisService: ChatRedisService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {}

  /**
   * Migrate messages từ guest session (Redis) sang user conversation (DB)
   */
  async migrateMessagesToDb(sessionId: string, userId: number, tenantId: number) {
    try {
      // Lấy messages từ Redis
      const sessionMessages = await this.chatRedisService.getSessionMessages(sessionId);

      if (!sessionMessages.length) {
        this.logger.log(`No messages to migrate for session ${sessionId}`);
        return { message: 'No messages to migrate' };
      }

      // Check xem đã migrate chưa (tránh duplicate)
      const existingConversation = await this.prisma.chatConversation.findFirst({
        where: { 
          userId, 
          tenantId,
          sessionId,
        },
      });

      if (existingConversation) {
        this.logger.log(`Session ${sessionId} already migrated to conversation ${existingConversation.id}`);
        return { conversationId: existingConversation.id };
      }

      // Dùng transaction để đảm bảo data consistency
      const result = await this.prisma.$transaction(async (tx) => {
        // Tạo conversation mới
        const conversation = await tx.chatConversation.create({
          data: {
            userId, 
            sessionId,
            tenantId,
            status: 'ACTIVE',
          },
        });

        // Migrate messages từ Redis sang DB
        const messagesData = sessionMessages.map(msg => ({
          conversationId: conversation.id,
          senderId: msg.senderId || null,
          senderType: msg.senderType,
          sessionId,
          message: msg.message,
          metadata: msg.metadata || null,
          createdAt: new Date(msg.createdAt),
        }));

        await tx.chatMessage.createMany({ data: messagesData });

        this.logger.log(`Migrated ${messagesData.length} messages from session ${sessionId} to conversation ${conversation.id}`);

        return { conversationId: conversation.id };
      });

      // Clear Redis sau khi migrate thành công
      await this.chatRedisService.clearSessionMessages(sessionId);

      return result;
    } catch (error) {
      this.logger.error(`Error migrating messages for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
 * Tạo conversation cho guest
 */
async createGuestConversation(sessionId: string, tenantId: number) {
  try {
    // Kiểm tra xem đã có conversation chưa
    const existingConversation = await this.prisma.chatConversation.findFirst({
      where: { 
        sessionId,
        status: 'ACTIVE',
      },
    });

    if (existingConversation) {
      return existingConversation;
    }

    // Tạo conversation mới
    const conversation = await this.prisma.chatConversation.create({
      data: {
        sessionId,
        tenantId,
        status: 'ACTIVE',
      },
    });

    this.logger.log(`Created guest conversation ${conversation.id} for session ${sessionId}`);
    return conversation;
  } catch (error) {
    this.logger.error(`Error creating guest conversation for session ${sessionId}:`, error);
    throw error;
  }
}

  /**
   * Lấy hoặc tạo conversation cho user
   * Dùng sessionId để link với guest messages nếu có
   */
  async getOrCreateConversation(params: { 
    userId: number; 
    tenantId: number;
    sessionId?: string | null;
  }): Promise<ChatConversation> {
    const { userId, tenantId, sessionId } = params;

    try {
      // Tìm conversation hiện có
      let conversation = await this.prisma.chatConversation.findFirst({
        where: { 
          userId, 
          tenantId,
          status: 'ACTIVE',
        },
        orderBy: { updatedAt: 'desc' },
        include: { messages: true },
      });

      // Nếu chưa có, tạo mới
      if (!conversation) {
        conversation = await this.prisma.chatConversation.create({
          data: {
            userId,
            tenantId,
            sessionId,
            status: 'ACTIVE',
          },
          include: { messages: true },
        });

        this.logger.log(`Created new conversation ${conversation.id} for user ${userId}`);
      } else if (sessionId && !conversation.sessionId) {
        // Update sessionId nếu conversation đã tồn tại nhưng chưa có sessionId
        conversation = await this.prisma.chatConversation.update({
          where: { id: conversation.id },
          data: { sessionId },
          include: { messages: true },
        });
      }

      return conversation;
    } catch (error) {
      this.logger.error(`Error in getOrCreateConversation for user ${userId}:`, error);
      throw error;
    }
  }

  async saveGuestMessage(
    sessionId: string,
    message: string,
    metadata?: any,
  ): Promise<ChatMessageRedis> {
    try {
      if (!sessionId) {
        sessionId = uuidv4();
      }

      // Validate message
      if (!message || message.trim().length === 0) {
        throw new Error('Message cannot be empty');
      }

      const guestMessage: ChatMessageRedis = {
        id: uuidv4(),
        sessionId,
        senderId: undefined,
        senderType: 'GUEST',
        message: message.trim(),
        metadata,
        createdAt: new Date().toISOString(),
      };

      await this.chatRedisService.saveSessionMessage(sessionId, guestMessage);
      this.logger.log(`Saved guest message for session ${sessionId}`);

      return guestMessage;
    } catch (error) {
      this.logger.error(`Error saving guest message:`, error);
      throw error;
    }
  }

  /**
   * Lưu tin nhắn bot vào Redis (cho guest)
   */
  async saveBotMessage(
    sessionId: string,
    message: string,
  ): Promise<ChatMessageRedis> {
    try {
      const botMessage: ChatMessageRedis = {
        id: uuidv4(),
        sessionId,
        senderId: undefined,
        senderType: 'BOT',
        message: message.trim(),
        metadata: null,
        createdAt: new Date().toISOString(),
      };

      await this.chatRedisService.saveSessionMessage(sessionId, botMessage);
      this.logger.log(`Saved bot message for session ${sessionId}`);

      return botMessage;
    } catch (error) {
      this.logger.error(`Error saving bot message:`, error);
      throw error;
    }
  }

  /**
   * Lưu tin nhắn bot vào DB (cho user login)
   */
  async saveBotMessageForUser(
    conversationId: number | null,
    sessionId: string | null,
    message: string,
    metadata?: any,
  ) {
    const trimmed = message.trim();
    if (!trimmed) throw new Error('Bot message cannot be empty');

    // TẠO OBJECT DATA THÔNG MINH – CHỈ THÊM FIELD NẾU CÓ GIÁ TRỊ
    const data: any = {
      senderId: null,
      senderType: 'BOT' as const,
      message: trimmed,
      metadata: { ...metadata, ai: true },
    };

    // Chỉ thêm conversationId nếu KHÁC null
    if (conversationId !== null) {
      data.conversationId = conversationId;
    }

    // Chỉ thêm sessionId nếu KHÁC null
    if (sessionId !== null) {
      data.sessionId = sessionId;
    }

    const botMessage = await this.prisma.chatMessage.create({
      data,
    });

    this.logger.log(`Bot message ${botMessage.id} saved`);
    return botMessage;
  }

  /**
   * Lưu tin nhắn của user (đã login) vào DB
   */
  async saveUserMessage(
    userId: number,
    tenantId: number,
    conversationId: number | undefined,
    message: string,
    sessionId: string,
    metadata?: any,
  ) {
    try {
      // === 1️⃣ Validate input ===
      const trimmed = message?.trim();
      if (!trimmed) throw new Error('Message cannot be empty');
      if (trimmed.length > 5000) throw new Error('Message too long (max 5000 chars)');

      // === 2️⃣ Lấy hoặc tạo conversation ===
      let conversation = conversationId
        ? await this.prisma.chatConversation.findUnique({ where: { id: conversationId } })
        : null;

      if (!conversation && userId) {
        conversation = await this.getOrCreateConversation({
          userId,
          tenantId,
          sessionId,
        });
      }

      if (!conversation) throw new Error('Cannot create or find conversation');

      // === 3️⃣ Lưu message của USER ===
      const dbMessage = await this.prisma.$transaction(async (tx) => {
        const msg = await tx.chatMessage.create({
          data: {
            conversationId: conversation.id,
            senderId: userId,
            senderType: 'USER',
            message: trimmed,
            metadata,
            sessionId,
          },
        });

        await tx.chatConversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });

        this.logger.log(`💬 User message ${msg.id} saved in conversation ${conversation.id}`);
        return msg;
      });

      // === 4️⃣ Trả về message của user ===
      return dbMessage;

    } catch (error) {
      this.logger.error('Error saving user message:', error);
      throw error;
    }
  }



  /**
   * Lấy lịch sử chat từ DB
   */
  async getConversationMessages(conversationId: number) {
    try {
      const id = parseInt(conversationId.toString(), 10); // Convert sang number
    if (isNaN(id)) {
      throw new Error(`Invalid conversationId: ${conversationId}`);
    }
      return await this.prisma.chatMessage.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: 'asc' },
        include: {
          conversation: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error getting conversation messages for ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Lấy messages từ Redis (guest)
   */
  async getSessionMessages(sessionId: string) {
    try {
      return await this.chatRedisService.getSessionMessages(sessionId);
    } catch (error) {
      this.logger.error(`Error getting session messages for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Lấy conversation theo id
   */
  async getConversationById(conversationId: number): Promise<ChatConversation | null> {
    try {
      return await this.prisma.chatConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error getting conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Lấy danh sách conversations của user
   */
  async getUserConversations(userId: number) {
    try {
      return await this.prisma.chatConversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Lấy message cuối cùng để hiển thị preview
          },
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error getting user conversations for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Lấy các tin nhắn của guest trước khi login
   */
  async getGuestMessagesBeforeLogin(sessionId: string) {
    try {
      // Tìm conversation từ DB
      let conversations = await this.prisma.chatConversation.findMany({
        where: { sessionId, status: 'ACTIVE' },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
      });

      // Nếu không có trong DB, lấy từ Redis
      if (conversations.length === 0) {
        const redisMessages = await this.getSessionMessages(sessionId);
        
        if (redisMessages.length > 0) {
          // Tạo temporary conversation object từ Redis messages
          const tempConversation = {
            id: -1,
            userId: null,
            sessionId,
            tenantId: 0,
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
            messages: redisMessages.map(msg => ({
              id: Math.floor(Math.random() * 1000000),
              conversationId: -1,
              senderId: msg.senderId || null,
              senderType: msg.senderType,
              message: msg.message,
              metadata: msg.metadata || null,
              isRead: false,
              createdAt: new Date(msg.createdAt),
            })),
            user: null,
          };
          conversations = [tempConversation as any];
        }
      }

      return conversations;
    } catch (error) {
      this.logger.error(`Error getting guest messages for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Lấy tất cả các conversations (dành cho admin)
   */
  async getAllConversations(params?: {
    tenantId?: number;
    status?: string;
    skip?: number;
    take?: number;
  }): Promise<any> {
    try {
      const { tenantId, status, skip = 0, take = 20 } = params || {};

      const where: any = {};
      if (tenantId) where.tenantId = tenantId;
      if (status) where.status = status;

      const [conversations, total] = await Promise.all([
        this.prisma.chatConversation.findMany({
          where,
          skip,
          take,
          orderBy: { updatedAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            tenant: {
              select: {
                id: true,
                name: true,
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1, // Chỉ lấy tin nhắn cuối
              select: {
                id: true,
                senderId: true,
                senderType: true,
                message: true,
                createdAt: true,
                isRead: true,
              },
            },
            _count: {
              select: {
                messages: {
                  where: {
                    isRead: false,
                    senderType: 'USER',
                  },
                },
              },
            },
          },
        }),
        this.prisma.chatConversation.count({ where }),
      ]);

      return {
        conversations,
        pagination: {
          total,
          page: Math.floor(skip / take) + 1,
          limit: take,
          totalPages: Math.ceil(total / take),
        },
      };
    } catch (error) {
      this.logger.error('Error getting all conversations:', error);
      throw error;
    }
  }

  /**
   * Close conversation
   */
  async closeConversation(conversationId: number) {
    try {
      return await this.prisma.chatConversation.update({
        where: { id: conversationId },
        data: { 
          status: 'CLOSED',
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Error closing conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Reopen conversation
   */
  async reopenConversation(conversationId: number) {
    try {
      return await this.prisma.chatConversation.update({
        where: { id: conversationId },
        data: { 
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Error reopening conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Assign conversation to admin
   */
  async assignConversation(conversationId: number, adminId: number) {
    try {
      return await this.prisma.chatConversation.update({
        where: { id: conversationId },
        data: { 
          assignedAdminId: adminId,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error assigning conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Get conversations assigned to admin
   */
  async getAdminConversations(adminId: number) {
    try {
      return await this.prisma.chatConversation.findMany({
        where: { assignedAdminId: adminId },
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderType: 'USER',
                },
              },
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error getting admin conversations for admin ${adminId}:`, error);
      throw error;
    }
  }

  /**
   * Search conversations
   */
  async searchConversations(keyword: string, tenantId?: number) {
    try {
      const where: any = {
        OR: [
          {
            user: {
              name: {
                contains: keyword,
                mode: 'insensitive',
              },
            },
          },
          {
            messages: {
              some: {
                message: {
                  contains: keyword,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      };

      if (tenantId) {
        where.tenantId = tenantId;
      }

      return await this.prisma.chatConversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 50,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
    } catch (error) {
      this.logger.error('Error searching conversations:', error);
      throw error;
    }
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(tenantId?: number) {
    try {
      const where: any = {};
      if (tenantId) where.tenantId = tenantId;

      const [
        totalConversations,
        activeConversations,
        closedConversations,
        totalMessages,
        unreadMessages,
        todayConversations,
      ] = await Promise.all([
        this.prisma.chatConversation.count({ where }),
        this.prisma.chatConversation.count({ 
          where: { ...where, status: 'ACTIVE' } 
        }),
        this.prisma.chatConversation.count({ 
          where: { ...where, status: 'CLOSED' } 
        }),
        this.prisma.chatMessage.count({
          where: tenantId ? { conversation: { tenantId } } : {},
        }),
        this.prisma.chatMessage.count({
          where: {
            isRead: false,
            senderType: 'USER',
            ...(tenantId && { conversation: { tenantId } }),
          },
        }),
        this.prisma.chatConversation.count({
          where: {
            ...where,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      ]);

      return {
        totalConversations,
        activeConversations,
        closedConversations,
        totalMessages,
        unreadMessages,
        todayConversations,
      };
    } catch (error) {
      this.logger.error('Error getting conversation stats:', error);
      throw error;
    }
  }

  /**
   * Lưu tin nhắn của admin vào Redis (cho guest chưa login)
   */
  async saveAdminMessageToGuest(
    adminId: number,
    sessionId: string,
    message: string,
    metadata?: any,
  ): Promise<ChatMessageRedis> {
    try {
      // Validate message
      if (!message || message.trim().length === 0) {
        throw new Error('Message cannot be empty');
      }

      if (message.length > 5000) {
        throw new Error('Message too long (max 5000 characters)');
      }

      const adminMessage: ChatMessageRedis = {
        id: uuidv4(),
        sessionId,
        senderId: adminId,
        senderType: 'ADMIN',
        message: message.trim(),
        metadata,
        createdAt: new Date().toISOString(),
      };

      await this.chatRedisService.saveSessionMessage(sessionId, adminMessage);
      this.logger.log(`Admin ${adminId} sent message to guest session ${sessionId}`);

      return adminMessage;
    } catch (error) {
      this.logger.error(`Error saving admin message to guest:`, error);
      throw error;
    }
  }

  /**
   * Lưu tin nhắn của admin vào DB
   */
  async saveAdminMessage(
    adminId: number,
    conversationId: number,
    message: string,
    metadata?: any,
  ) {
    try {
      // Validate message
      if (!message || message.trim().length === 0) {
        throw new Error('Message cannot be empty');
      }

      if (message.length > 5000) {
        throw new Error('Message too long (max 5000 characters)');
      }

      // Check conversation tồn tại
      const conversation = await this.prisma.chatConversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Dùng transaction để update conversation và create message
      return await this.prisma.$transaction(async (tx) => {
        const dbMessage = await tx.chatMessage.create({
          data: {
            conversationId,
            senderId: adminId,
            senderType: 'ADMIN',
            message: message.trim(),
            metadata,
          },
        });

        // Update conversation updatedAt
        await tx.chatConversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        this.logger.log(`Admin ${adminId} sent message ${dbMessage.id} in conversation ${conversationId}`);

        return dbMessage;
      });
    } catch (error) {
      this.logger.error(`Error saving admin message:`, error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: number, readerId: number) {
    try {
      await this.prisma.chatMessage.updateMany({
        where: {
          conversationId,
          isRead: false,
          senderId: { not: readerId }, // Không mark tin nhắn của chính mình
        },
        data: {
          isRead: true,
        },
      });

      this.logger.log(`Marked messages as read for conversation ${conversationId} by user ${readerId}`);
    } catch (error) {
      this.logger.error(`Error marking messages as read:`, error);
      throw error;
    }
  }

  /**
   * Get unread message count cho admin
   */
  async getUnreadMessagesCount(tenantId?: number) {
    try {
      const where: any = {
        isRead: false,
        senderType: 'USER', // Chỉ đếm tin nhắn từ user
      };

      if (tenantId) {
        where.conversation = { tenantId };
      }

      const count = await this.prisma.chatMessage.count({ where });
      return count;
    } catch (error) {
      this.logger.error('Error getting unread messages count:', error);
      throw error;
    }
  }

  /**
   * Cleanup old guest sessions (gọi từ cron job)
   */
  async cleanupOldGuestSessions(olderThanHours: number = 24) {
    try {
      const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
      
      // Cleanup trong Redis (cần implement trong ChatRedisService)
      // await this.chatRedisService.cleanupOldSessions(cutoffDate);
      
      this.logger.log(`Cleaned up guest sessions older than ${olderThanHours} hours`);
    } catch (error) {
      this.logger.error('Error cleaning up old sessions:', error);
    }
  }

async getConversationIdsByUserId(
  userId: number,
  tenantId?: number,
): Promise<number[]> {
  try {
    const where: any = {
      userId,
      status: 'ACTIVE',
      sessionId: { not: null },
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const conversations = await this.prisma.chatConversation.findMany({
      where,
      select: { id: true },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map(c => c.id);
  } catch (error) {
    this.logger.error(`Error getting conversationIds for user ${userId}:`, error);
    throw error;
  }
}

}
