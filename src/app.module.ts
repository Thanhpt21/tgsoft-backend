import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenant/tenants.module';
import { RoleModule } from './modules/role/roles.module';
import { PermissionsModule } from './modules/permission/permissions.module';
import { RolePermissionsModule } from './modules/role-permission/role-permissions.module';
import { UserTenantRolesModule } from './modules/user-tenant-role/user-tenant-roles.module';
import { TenantMiddleware } from './common/middlewares/tenant.middleware';
import { AttributeModule } from './modules/attributes/attribute.module';
import { ProductModule } from './modules/products/product.module';
import { ProductVariantModule } from './modules/product-variants/product-variant.module';
import { WarehouseModule } from './modules/warehouses/warehouse.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AttributeValuesModule } from './modules/attribute-values/attribute-values.module';
import { ProductAttributesModule } from './modules/product-attributes/product-attributes.module';
import { OrderModule } from './modules/orders/orders.module';
import { PaymentMethodsModule } from './modules/payment-method/payment-methods.module';
import { PaymentsModule } from './modules/payment/payments.module';
import { RefundsModule } from './modules/refund/refunds.module';
import { CartModule } from './modules/cart/cart.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { PayoutsModule } from './modules/payout/payouts.module';
import { FinancialTransactionModule } from './modules/financial-transaction/financial-transaction.module';
import { CommissionModule } from './modules/commisson/commission.module';
import { BrandModule } from './modules/brand/brand.module';
import { CategoryModule } from './modules/category/category.module';
import { VariantAttributeValuesModule } from './modules/variant-attribute-values/variant-attribute-values.module';
import { ConfigsModule } from './modules/config/config.module';
import { BlogModule } from './modules/blog/blog.module';
import { ContactModule } from './modules/contact/contact.module';
import { GhtkModule } from './modules/ghtk/ghtk.module';



@Module({
  imports: [
     ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env',  // Chọn file .env.prod nếu là môi trường sản xuất
      isGlobal: true,  // Biến môi trường có thể truy cập ở bất kỳ đâu
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    TenantsModule,
    RoleModule,
    PermissionsModule,
    RolePermissionsModule,
    UserTenantRolesModule,
    AttributeModule,
    ProductModule,
    ProductVariantModule,
    WarehouseModule,
    InventoryModule,
    AttributeValuesModule,
    ProductAttributesModule,
    OrderModule,
    PaymentMethodsModule,
    PaymentsModule,
    RefundsModule,
    CartModule,
    ShippingModule,
    AuditLogModule,
    PayoutsModule,
    FinancialTransactionModule,
    CommissionModule,
    BrandModule,
    CategoryModule,
    ConfigsModule,
    VariantAttributeValuesModule,
    BlogModule,
    ContactModule,
    GhtkModule
  ],
  controllers: [AppController],
   providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Áp dụng middleware TenantMiddleware cho các route liên quan đến tenant
    consumer
      .apply(TenantMiddleware)
      .forRoutes(
      'users',
      'tenants',
      'roles',
      'permissions',
      'role-permissions',
      'user-tenant-roles',
      'attributes',
      'products',
      'product-variants',
      'warehouses',
      'inventories',
      'attribute-values',
      'product-attributes',
      'orders',
      'payment-methods',
      'payments',
      'refunds',
      'cart',
      'shipping',
      'audit-log',
      'payouts',
      'financial-transactions',
      'commissions',
      'brands',
      'categories',
      'configs',
      'variant-attribute-values',
      'blogs',
      'contacts',
      'ghtk',
    );
  }
}
