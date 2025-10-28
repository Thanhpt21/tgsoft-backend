// src/core/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: ConfigService) => {
        const redisConfig = config.get('redis');
        return new Redis({
          host: redisConfig.host,
          port: redisConfig.port,
          password: redisConfig.password,
          db: redisConfig.db,
        });
      },
      inject: [ConfigService],
    },
    {
      provide: 'REDIS_TTL',
      useFactory: (config: ConfigService) => config.get<number>('redis.ttl', 604800),
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT', 'REDIS_TTL'],
})
export class RedisModule {}