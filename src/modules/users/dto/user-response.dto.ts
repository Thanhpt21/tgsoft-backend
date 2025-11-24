import { User, UserTag } from '@prisma/client';

export class UserResponseDto {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  gender: string | null;
  avatar: string | null;
  isActive: boolean;
  type_account: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId?: number;
  conversationId: number | null;
  tokenAI?: number;
  defaultTokens?: number; 
  fixedTokens?: number;
  chatEnabled: boolean;
  tag: UserTag | null;

  constructor(user: User, conversationId: number | null = null) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.phone = user.phone;
    this.gender = user.gender;
    this.avatar = user.avatar;
    this.isActive = user.isActive;
    this.type_account = user.type_account;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.tenantId = user.tenantId ?? undefined;
    this.conversationId = conversationId;
    this.tokenAI = user.tokenAI ?? undefined;
    this.defaultTokens = user.defaultTokens ?? undefined;
    this.fixedTokens = user.fixedTokens ?? undefined;
    this.chatEnabled = user.chatEnabled ?? true;
    this.tag = user.tag ?? null; 
  }
}