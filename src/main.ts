// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT');
  const clientUrl = configService.get<string>('CLIENT_URL');
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (!port) {
    throw new Error('PORT environment variable is not defined.');
  }

  // ===== CẤU HÌNH =====
  app.use(cookieParser());

  app.enableCors({
    origin: clientUrl,
    methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    credentials: true,
  });

// DÙNG UPLOAD_DIR TỪ .env – LINH HOẠT CHO MỌI MÔI TRƯỜNG
  const uploadDir = configService.get<string>('UPLOAD_DIR', join(process.cwd(), 'uploads'));
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads',
  });
  
  app.setGlobalPrefix('api');

  // ===== KHỞI ĐỘNG =====
  await app.listen(port);

  console.log(`Server is running on: http://localhost:${port}/api`);
  console.log(`Images served at: http://localhost:${port}/uploads`);
  console.log(`WebSocket: ws://localhost:${port}/chat`);
  console.log(`Running in ${nodeEnv} mode`);
}

bootstrap();