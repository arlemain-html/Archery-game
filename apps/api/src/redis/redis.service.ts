import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('REDIS_URL');
    if (!url) {
      throw new Error('REDIS_URL is not defined');
    }
    this.client = new Redis(url);
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  getClient(): Redis {
    return this.client;
  }

  async setNonce(wallet: string, nonce: string, ttlSeconds: number = 300) {
    await this.client.set(`nonce:${wallet}`, nonce, 'EX', ttlSeconds);
  }

  async getNonce(wallet: string): Promise<string | null> {
    return this.client.get(`nonce:${wallet}`);
  }

  async deleteNonce(wallet: string) {
    await this.client.del(`nonce:${wallet}`);
  }

  async blacklistToken(jti: string, ttlSeconds: number) {
    await this.client.set(`blacklist:${jti}`, 'true', 'EX', ttlSeconds);
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const result = await this.client.get(`blacklist:${jti}`);
    return result === 'true';
  }
}
