// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT');
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (!port) {
    throw new Error('PORT environment variable is not defined.');
  }

  app.use(cookieParser());

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000', 
        'http://localhost:3001', 
        'https://demo.aiban.vn',
        'https://db.aiban.vn'
      ];

      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);  
      } else {
        callback(new Error('Not allowed by CORS'), false);  
      }
    },
    methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    credentials: true,
  });

  app.setGlobalPrefix('api');


  await app.listen(port);

  console.log(`Server is running on: http://localhost:${port}/api`);
  console.log(`Images served at: http://localhost:${port}/uploads`);
  console.log(`WebSocket: ws://localhost:${port}/chat`);
  console.log(`Running in ${nodeEnv} mode`);
}

bootstrap();