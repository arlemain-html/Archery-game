import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';

import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { InventoryModule } from './inventory/inventory.module';
import { AchievementModule } from './achievement/achievement.module';
import { MatchModule } from './match/match.module';
import { ReplayModule } from './replay/replay.module';
import { IndexerModule } from './indexer/indexer.module';
import { HealthModule } from './health/health.module';
import { CronModule } from './cron/cron.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { SeasonPassModule } from './season-pass/season-pass.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        DIRECT_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        RPC_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        BACKEND_PRIVATE_KEY: Joi.string().required(),
      }),
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 requests per minute by default
    }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    ProfileModule,
    InventoryModule,
    AchievementModule,
    MatchModule,
    ReplayModule,
    IndexerModule,
    HealthModule,
    CronModule,
    LeaderboardModule,
    SeasonPassModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
