import { Order, OrderItem, Payment, PaymentMethod, User } from '@prisma/client';

// DTO cơ bản cho user (ẩn password, token, v.v.)
export class UserBasicDto {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  gender?: string | null;
  avatar?: string | null;
  isActive: boolean;
  type_account: string;
  tenantId?: number | null;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.phone = user.phone;
    this.gender = user.gender;
    this.avatar = user.avatar;
    this.isActive = user.isActive;
    this.type_account = user.type_account;
    this.tenantId = user.tenantId;
  }
}

// DTO cơ bản cho payment method
export class PaymentMethodBasicDto {
  id: number;
  code: string;
  name: string;

  constructor(method: PaymentMethod) {
    this.id = method.id;
    this.code = method.code;
    this.name = method.name;
  }
}

// DTO phản hồi cho Order
export class OrderResponseDto {
  id: number;
  userId: number;
  tenantId: number;
  totalAmount: number;
  currency: string;
  shippingInfo?: any;
  status: string;
  paymentStatus: string;
  shippingFee: number;
  deliveryMethod?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItem[];
  payments?: Payment[];
  user?: UserBasicDto;
  paymentMethod?: PaymentMethodBasicDto; // ✅ thêm vào đây

  constructor(
    order: Order & {
      items?: OrderItem[];
      payments?: Payment[];
      user?: User;
      paymentMethod?: PaymentMethod; // ✅ thêm relation
    },
  ) {
    this.id = order.id;
    this.userId = order.userId;
    this.tenantId = order.tenantId;
    this.totalAmount = order.totalAmount;
    this.currency = order.currency;
    this.shippingInfo = order.shippingInfo;
    this.status = order.status;
    this.paymentStatus = order.paymentStatus;
    this.shippingFee = order.shippingFee;
    this.deliveryMethod = (order as any).deliveryMethod || 'standard';
    this.createdAt = order.createdAt;
    this.updatedAt = order.updatedAt;
    this.items = order.items || [];
    this.payments = order.payments || [];

    if (order.user) {
      this.user = new UserBasicDto(order.user);
    }

    if (order.paymentMethod) {
      this.paymentMethod = new PaymentMethodBasicDto(order.paymentMethod);
    }
  }
}
