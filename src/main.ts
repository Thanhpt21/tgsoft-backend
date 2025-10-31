import './config/env.config'; // PHẢI Ở ĐẦU TIÊN!

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';

async function bootstrap() {
  const nodeEnv = process.env.NODE_ENV || 'development';  // Nếu NODE_ENV không có, mặc định là 'development'

  // Tải đúng tệp .env tùy vào NODE_ENV
  if (nodeEnv === 'production') {
    dotenv.config({ path: '.env.prod' });
  } else {
    dotenv.config({ path: '.env' });
  }


  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT');
  const clientUrl = configService.get<string>('CLIENT_URL');


  if (!port) {
    throw new Error('PORT environment variable is not defined.');
  }

  app.use(cookieParser());

  app.enableCors({
    origin: clientUrl,
    methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    credentials: true,
  });

  const uploadsPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  app.setGlobalPrefix('api');

  await app.listen(port);

  console.log(`✅ Server is running on: http://localhost:${port}/api`);
  console.log(`🔌 WebSocket running: ws://localhost:${port}/chat`);
  console.log(`✅ Đang chạy ${nodeEnv} mode`);
}

bootstrap();
