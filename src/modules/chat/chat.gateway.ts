import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatRedisService } from './redis/chat-redis.service';
import { v4 as uuidv4 } from 'uuid';
import { ChatService } from './chat.service';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST'],
  },
  namespace: '/chat',
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
})



export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly chatRedisService: ChatRedisService,

    private readonly prisma: PrismaService
  ) {}

  

  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.auth.userId 
        ? parseInt(client.handshake.auth.userId) 
        : null;
      const sessionId = client.handshake.auth.sessionId || uuidv4();
      const tenantId = client.handshake.auth.tenantId 
        ? parseInt(client.handshake.auth.tenantId) 
        : 1;
      const isAdmin = client.handshake.auth.isAdmin === true || client.handshake.auth.isAdmin === 'true';

      client.data.userId = userId;
      client.data.sessionId = sessionId;
      client.data.tenantId = tenantId;
      client.data.conversationId = null;
      client.data.isAdmin = isAdmin;

      this.logger.log(`Client connected: ${client.id}`, {
        userId,
        sessionId,
        tenantId,
        isAdmin,
      });

      // Nếu là admin, join vào admin room để nhận thông báo
      if (isAdmin) {
        client.join('admin-room');
        this.logger.log(`Admin ${userId} joined admin-room`);
      }

      // Gửi sessionId về client
      client.emit('session-initialized', { sessionId });

      // Gửi client vào room theo sessionId
      client.join(`session:${sessionId}`);

      if (userId && !isAdmin) {
        const result = await this.chatService.migrateMessagesToDb(sessionId, userId, tenantId);
        if ('conversationId' in result && result.conversationId) {
          client.data.conversationId = result.conversationId;
          client.join(`conversation:${result.conversationId}`);
          client.emit('conversation-updated', { conversationId: result.conversationId });
        }

        await this.chatRedisService.setUserOnline(userId);
      }
    } catch (error) {
      this.logger.error('Error in handleConnection:', error);
      client.emit('error', { message: 'Lỗi kết nối' });
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    if (client.data.isAdmin) {
      client.leave('admin-room');
    }

    if (client.data.userId) {
      await this.chatRedisService.setUserOffline(client.data.userId);
    }
  }

  @SubscribeMessage('create:guest-conversation')
async handleCreateGuestConversation(
  @MessageBody() data: { sessionId: string; tenantId: number },
  @ConnectedSocket() client: Socket,
) {
  try {
    const { sessionId, tenantId } = data;

    // Validate
    if (!sessionId) {
      client.emit('error', { message: 'SessionId is required' });
      return;
    }

    this.logger.log(`Creating guest conversation for session: ${sessionId}`);

    // Tạo conversation cho guest trong DB
    const conversation = await this.prisma.chatConversation.create({
      data: {
        sessionId,
        tenantId,
        status: 'ACTIVE',
        // Không có userId vì là guest
      },
    });

    // Cập nhật client data
    client.data.conversationId = conversation.id;
    client.data.sessionId = sessionId;
    client.data.tenantId = tenantId;

    // Join conversation room
    client.join(`conversation:${conversation.id}`);

    // Gửi response về client
    client.emit('guest-conversation-created', { 
      conversationId: conversation.id 
    });

    this.logger.log(`Guest conversation created: ${conversation.id} for session ${sessionId}`);

  } catch (error) {
    this.logger.error('Error creating guest conversation:', error);
    client.emit('error', { message: 'Lỗi khi tạo conversation cho guest' });
  }
}

  @SubscribeMessage('user-login')
  async handleUserLogin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: number }
  ) {
    try {
      const { userId } = payload;
      
      // Validate userId
      if (!userId || userId <= 0) {
        client.emit('error', { message: 'Invalid userId' });
        return;
      }

      client.data.userId = userId;

      if (!client.data.sessionId) {
        client.data.sessionId = uuidv4();
        this.logger.log(`Created new session for user ${userId}: ${client.data.sessionId}`);
      }

      client.data.senderType = 'USER';

      // Migrate messages từ guest sang user
      const result = await this.chatService.migrateMessagesToDb(
        client.data.sessionId, 
        userId, 
        client.data.tenantId
      );

      if (result.conversationId) {
        client.data.conversationId = result.conversationId;
        client.join(`conversation:${result.conversationId}`);

        const conversation = await this.chatService.getConversationById(result.conversationId);
        client.emit('conversation-updated', conversation);
      }

      await this.chatRedisService.setUserOnline(userId);
      this.logger.log(`Guest session ${client.data.sessionId} migrated to user ${userId}`);
    } catch (error) {
      this.logger.error('Error in handleUserLogin:', error);
      client.emit('error', { message: 'Lỗi khi đăng nhập chat' });
    }
  }

  @SubscribeMessage('admin-login')
  async handleAdminLogin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { adminId: number }
  ) {
    try {
      const { adminId } = payload;
      
      if (!adminId || adminId <= 0) {
        client.emit('error', { message: 'Invalid adminId' });
        return;
      }

      client.data.userId = adminId;
      client.data.isAdmin = true;
      client.join('admin-room');

      this.logger.log(`Admin ${adminId} logged in and joined admin-room`);
      client.emit('admin-login-success', { adminId });
    } catch (error) {
      this.logger.error('Error in handleAdminLogin:', error);
      client.emit('error', { message: 'Lỗi khi đăng nhập admin' });
    }
  }

  @SubscribeMessage('join:conversation')
  async handleJoinConversation(
    @MessageBody() conversationId: number,
    @ConnectedSocket() client: Socket,
  ) {
    if (!conversationId || conversationId <= 0) {
      client.emit('error', { message: 'Invalid conversationId' });
      return;
    }
    client.join(`conversation:${conversationId}`);
    client.data.conversationId = conversationId;
    this.logger.log(`Client ${client.id} (userId: ${client.data.userId}, isAdmin: ${client.data.isAdmin}) joined conversation ${conversationId}`);
  }

  @SubscribeMessage('leave:conversation')
  async handleLeaveConversation(
    @MessageBody() conversationId: number,
    @ConnectedSocket() client: Socket,
  ) {
    if (!conversationId || conversationId <= 0) {
      return;
    }

    client.leave(`conversation:${conversationId}`);
    if (client.data.conversationId === conversationId) {
      client.data.conversationId = null;
    }
    this.logger.log(`Client ${client.id} left conversation ${conversationId}`);
  }

@SubscribeMessage('send:message')
async handleSendMessage(
  @MessageBody() data: { 
    message: string; 
    conversationId?: number; 
    metadata?: any; 
    tempId?: string;
    sessionId?: string;
    tenantId?: number;
  },
  @ConnectedSocket() client: Socket,
) {
  try {
    // -------------------- 1️⃣ Validate message --------------------
    if (!data.message || typeof data.message !== 'string') {
      client.emit('error', { message: 'Message is required' });
      return;
    }

    const trimmedMessage = data.message.trim();
    if (trimmedMessage.length === 0) {
      client.emit('error', { message: 'Message cannot be empty' });
      return;
    }

    if (trimmedMessage.length > 5000) {
      client.emit('error', { message: 'Message too long (max 5000 characters)' });
      return;
    }

    const { userId, sessionId: clientSessionId, tenantId: clientTenantId, conversationId: clientConversationId } = client.data;
    
    // Sử dụng sessionId từ client hoặc từ client data
    const sessionId = data.sessionId || clientSessionId;
    const tenantId = data.tenantId || clientTenantId;
    let conversationId = data.conversationId || clientConversationId;

    // -------------------- 2️⃣ User đã login --------------------
    let conversation: any;
    if (userId) {
      this.logger.log(`USER logged in - userId: ${userId}, message: "${trimmedMessage}"`);

      if (!conversationId) {
        conversation = await this.chatService.getOrCreateConversation({ userId, tenantId, sessionId });
        conversationId = conversation.id;
      }

      const message = await this.chatService.saveUserMessage(
        userId,
        tenantId,
        conversationId,
        trimmedMessage,
        sessionId,
        data.metadata,
      );

      if (data.tempId) (message as any).tempId = data.tempId;

      if (!client.data.conversationId && message.conversationId) {
        client.data.conversationId = message.conversationId;
        client.join(`conversation:${message.conversationId}`);
        client.emit('conversation-updated', { conversationId: message.conversationId });
      }

      this.server.to(`conversation:${message.conversationId}`).emit('message', message);

      this.server.to('admin-room').emit('new-user-message', {
        conversationId: message.conversationId,
        userId,
        message,
        tenantId,
      });
    } else {
      // -------------------- 3️⃣ Guest --------------------
      this.logger.log(`GUEST - sessionId: ${sessionId}, message: "${trimmedMessage}"`);

      // Nếu guest chưa có conversation, tạo mới
      if (!conversationId) {
        conversation = await this.chatService.createGuestConversation(sessionId, tenantId);
        conversationId = conversation.id;
        
        // Cập nhật client data và join room
        client.data.conversationId = conversationId;
        client.join(`conversation:${conversationId}`);
        
        // Thông báo cho client
        client.emit('conversation-updated', { conversationId });
      }

      // Lưu tin nhắn guest vào DB (thay vì Redis)
      const guestMessage = await this.prisma.chatMessage.create({
        data: {
          conversationId,
          senderType: 'GUEST',
          message: trimmedMessage,
          metadata: {
            ...data.metadata,
            isGuest: true,
            guestSessionId: sessionId
          },
          sessionId,
        },
      });

      if (data.tempId) (guestMessage as any).tempId = data.tempId;

      // Emit message
      this.server.to(`conversation:${conversationId}`).emit('message', guestMessage);

      // Thông báo cho admin
      this.server.to('admin-room').emit('new-guest-message', {
        conversationId,
        sessionId,
        message: guestMessage,
        tenantId,
      });

      this.logger.log(`Guest message saved to conversation ${conversationId}`);
    }
   
  } catch (error) {
    this.logger.error('Error sending message:', error);
    client.emit('error', { message: 'Lỗi khi gửi tin nhắn' });
    
    // Gửi lỗi về cho tempId nếu có
    if (data.tempId) {
      client.emit('message:failed', { tempId: data.tempId });
    }
  }
}

  @SubscribeMessage('admin:send-message')
  async handleAdminSendMessage(
    @MessageBody() data: { 
      conversationId?: number;
      sessionId?: string; 
      message: string;
      metadata?: any;
      tempId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Kiểm tra quyền admin
      if (!client.data.isAdmin) {
        client.emit('error', { message: 'Unauthorized: Admin only' });
        return;
      }

      // Validate: phải có conversationId HOẶC sessionId
      if (!data.conversationId && !data.sessionId) {
        client.emit('error', { message: 'conversationId or sessionId is required' });
        return;
      }

      if (!data.message || data.message.trim().length === 0) {
        client.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      const { userId: adminId } = client.data;
      const trimmedMessage = data.message.trim();

      // Trường hợp 1: Admin reply cho user đã login (có conversationId)
      if (data.conversationId) {
        this.logger.log(`ADMIN ${adminId} sending message to conversation ${data.conversationId}`);

        // Lưu admin message vào DB
        const message = await this.chatService.saveAdminMessage(
          adminId,
          data.conversationId,
          trimmedMessage,
          data.metadata,
        );

        if (data.tempId) {
          (message as any).tempId = data.tempId;
        }


        // Emit message cho user trong conversation
        this.server.to(`conversation:${data.conversationId}`).emit('message', message);

        this.logger.log(`Admin message sent to conversation ${data.conversationId}`);
        return;
      }

      // Trường hợp 2: Admin reply cho guest (chỉ có sessionId, chưa có conversation)
      if (data.sessionId) {
        this.logger.log(`ADMIN ${adminId} sending message to guest session ${data.sessionId}`);

        // Lưu admin message vào Redis
        const adminMessage = await this.chatService.saveAdminMessageToGuest(
          adminId,
          data.sessionId,
          trimmedMessage,
          data.metadata,
        );

        // Emit message cho admin
        client.emit('message', adminMessage);

        // Emit message cho guest trong session room
        this.server.to(`session:${data.sessionId}`).emit('message', adminMessage);

        this.logger.log(`Admin message sent to guest session ${data.sessionId}`);
      }
    } catch (error) {
      this.logger.error('Error in admin send message:', error);
      client.emit('error', { message: 'Lỗi khi gửi tin nhắn admin' });
    }
  }

   @SubscribeMessage('bot:send-message')
  async handleBotSendMessage(
    @MessageBody() data: { 
      conversationId?: number;
      sessionId?: string;
      message: string;
      metadata?: any;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!data.message || data.message.trim().length === 0) {
        client.emit('error', { message: 'Bot message cannot be empty' });
        return;
      }

      const trimmedMessage = data.message.trim();

      // Trường hợp 1: BOT reply cho user đã login (có conversationId)
      if (data.conversationId) {
        this.logger.log(`🤖 BOT sending message to conversation ${data.conversationId}`);

        const botMessage = await this.chatService.saveBotMessageForUser(
          data.conversationId,
          trimmedMessage,
          data.metadata,
        );

        // Emit message cho tất cả clients trong conversation
        this.server.to(`conversation:${data.conversationId}`).emit('message', botMessage);

        this.logger.log(`🤖 Bot message saved and sent to conversation ${data.conversationId}`);
        return;
      }

      // Trường hợp 2: BOT reply cho guest (chỉ có sessionId)
      if (data.sessionId) {
        this.logger.log(`🤖 BOT sending message to guest session ${data.sessionId}`);

        const botMessage = await this.chatService.saveBotMessage(
          data.sessionId,
          trimmedMessage,
        );

        // Emit message cho guest trong session room
        this.server.to(`session:${data.sessionId}`).emit('message', botMessage);

        this.logger.log(`🤖 Bot message saved and sent to session ${data.sessionId}`);
        return;
      }

      client.emit('error', { message: 'conversationId or sessionId is required' });
    } catch (error) {
      this.logger.error('Error in bot send message:', error);
      client.emit('error', { message: 'Lỗi khi lưu tin nhắn BOT' });
    }
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @MessageBody() data: { conversationId?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId, conversationId: clientConversationId, isAdmin } = client.data;
    const conversationId = data.conversationId || clientConversationId;

    if (userId && conversationId) {
      await this.chatRedisService.setTyping(conversationId, userId, true);
      client.to(`conversation:${conversationId}`).emit('typing', { 
        userId, 
        isTyping: true,
        isAdmin,
      });
    }
  }
  

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @MessageBody() data: { conversationId?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId, conversationId: clientConversationId, isAdmin } = client.data;
    const conversationId = data.conversationId || clientConversationId;

    if (userId && conversationId) {
      await this.chatRedisService.setTyping(conversationId, userId, false);
      client.to(`conversation:${conversationId}`).emit('typing', { 
        userId, 
        isTyping: false,
        isAdmin,
      });
    }
  }
}