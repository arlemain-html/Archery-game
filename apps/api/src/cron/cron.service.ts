import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.debug('Running background cleanup tasks...');
    
    // Clean up expired sessions
    const sessionResult = await this.prisma.session.deleteMany({
      where: {
        expires_at: { lt: new Date() },
      },
    });
    this.logger.debug(`Cleaned up ${sessionResult.count} expired sessions`);

    // Clean up expired nonces
    const nonceResult = await this.prisma.nonce.deleteMany({
      where: {
        expires_at: { lt: new Date() },
      },
    });
    this.logger.debug(`Cleaned up ${nonceResult.count} expired nonces`);
  }
}
