// src/modules/chat/ai/ai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from 'prisma/prisma.service';

interface AiOptions {
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

   async isAiChatEnabled(tenantId: number): Promise<boolean> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { aiChatEnabled: true }, 
      });
      return !!tenant?.aiChatEnabled;
    } catch (error) {
      this.logger.error(`Error fetching aiChatEnabled for tenant ${tenantId}`, error);
      return false;
    }
  }

  async setAiChatEnabled(tenantId: number, enabled: boolean): Promise<boolean> {
    try {
        const tenant = await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { aiChatEnabled: enabled },
        });
        return tenant.aiChatEnabled;
    } catch (error) {
        this.logger.error(`Error setting aiChatEnabled for tenant ${tenantId}`, error);
        return false;
    }
  }

  async generateTenantReply(
    tenantId: number,
    conversationHistory: { senderType: string; message: string }[],
    options?: AiOptions,
  ): Promise<string | null> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant?.aiChatEnabled) return null;

    const systemPrompt =
      options?.systemPrompt || tenant.aiSystemPrompt || 
      'Bạn là trợ lý hỗ trợ khách hàng thân thiện, trả lời ngắn gọn và chuyên nghiệp.';

    // Ép type để bypass lỗi "name" required
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(m => ({
        role: m.senderType === 'USER' ? 'user' : 'assistant',
        content: m.message,
      })),
    ] as unknown as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

    try {
      const completion = await this.openai.chat.completions.create({
        model: options?.model || tenant.aiModel!,
        temperature: options?.temperature ?? tenant.aiTemperature ?? 0.7,
        max_tokens: options?.maxTokens ?? tenant.aiMaxTokens ?? 512,
        messages,
      });

      return completion.choices[0].message?.content ?? null;
    } catch (error) {
      this.logger.error('❌ AI generateTenantReply error:', error);
      return null;
    }
  }
}
