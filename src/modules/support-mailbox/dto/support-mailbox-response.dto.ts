import { SupportStatus } from '@prisma/client';

export class SupportMailboxResponseDto {
  id: number;
  title: string;
  description?: string | null; // Cho phép null
  images?: any;
  status: SupportStatus;
  
  // Phản hồi từ admin
  adminReply?: string | null;
  repliedAt?: Date | null;
  repliedBy?: number | null;
  replier?: {
    id: number;
    name: string;
    email: string;
  } | null;
   tenant?: {
    id: number;
    name: string;
  };
  
  // Phản hồi từ shop
  shopReply?: string | null;
  shopRepliedAt?: Date | null;
  
  // Thông tin cơ bản
  createdBy: number;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
  
  creator?: {
    id: number;
    name: string;
    email: string;
  };

  constructor(partial: Partial<SupportMailboxResponseDto>) {
    Object.assign(this, partial);
  }
}