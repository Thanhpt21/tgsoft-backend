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
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
  path: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly chatRedisService: ChatRedisService,
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
        if (result.conversationId) {
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
    @MessageBody() data: { message: string; conversationId?: number; metadata?: any },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Validate message
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

      const { userId, sessionId, tenantId, conversationId: clientConversationId } = client.data;
      let conversationId = data.conversationId || clientConversationId;

      // User đã login
      if (userId) {
        this.logger.log(`USER logged in - userId: ${userId}, sending message: "${trimmedMessage}"`);

        // Tạo hoặc lấy conversation
        if (!conversationId) {
          const conversation = await this.chatService.getOrCreateConversation({
            userId,
            tenantId,
            sessionId,
          });
          conversationId = conversation.id;
        }

        // Lưu message vào DB
        const message = await this.chatService.saveUserMessage(
          userId,
          tenantId,
          conversationId,
          trimmedMessage,
          sessionId,
          data.metadata,
        );

        // Update conversationId trong client data nếu chưa có
        if (!client.data.conversationId && message.conversationId) {
          client.data.conversationId = message.conversationId;
          client.join(`conversation:${message.conversationId}`);
          client.emit('conversation-updated', { conversationId: message.conversationId });
        }

        // Emit message đến client và conversation room
        client.emit('message', message);
        client.to(`conversation:${message.conversationId}`).emit('message', message);
        
        // Thông báo cho admin có tin nhắn mới
        this.server.to('admin-room').emit('new-user-message', {
          conversationId: message.conversationId,
          userId,
          message: message,
          tenantId,
        });

        return;
      }

      // Guest user (chưa login)
      this.logger.log(`GUEST - sessionId: ${sessionId}, sending message: "${trimmedMessage}"`);
      
      // Lưu guest message vào Redis
      const guestMessage = await this.chatService.saveGuestMessage(
        sessionId,
        trimmedMessage,
        data.metadata,
      );

      // Emit message
      client.emit('message', guestMessage);
      client.to(`session:${sessionId}`).emit('message', guestMessage);

      // Thông báo cho admin có guest message mới
      this.server.to('admin-room').emit('new-guest-message', {
        sessionId,
        message: guestMessage,
        tenantId, // Admin cần biết tenant để filter
      });

      // Auto reply bot cho guest
      setTimeout(async () => {
        try {
          const botMessage = await this.chatService.saveBotMessage(
            sessionId,
            "Cảm ơn bạn đã liên hệ! Admin sẽ phản hồi trong giây lát.",
          );
          client.emit('message', botMessage);
          client.to(`session:${sessionId}`).emit('message', botMessage);
        } catch (error) {
          this.logger.error('Error sending bot message:', error);
        }
      }, 1000);

    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: 'Lỗi khi gửi tin nhắn' });
    }
  }

  @SubscribeMessage('admin:send-message')
  async handleAdminSendMessage(
    @MessageBody() data: { 
      conversationId?: number;
      sessionId?: string; 
      message: string;
      metadata?: any;
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

        // Emit message cho admin
        client.emit('message', message);

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