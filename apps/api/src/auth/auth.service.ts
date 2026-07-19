import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SiweMessage, generateNonce } from 'siwe';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async generateNonce(address: string): Promise<string> {
    const nonce = generateNonce();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // 1. Save to DB (Single Source of Truth)
    await this.prisma.nonce.upsert({
      where: { nonce },
      update: { wallet_address: address, expires_at: expiresAt },
      create: { nonce, wallet_address: address, expires_at: expiresAt },
    });

    // 2. Cache in Redis
    await this.redis.setNonce(address, nonce, 300);

    return nonce;
  }

  async verifySiweAndLogin(messageStr: string, signature: string) {
    try {
      const siweMessage = new SiweMessage(messageStr);
      const fields = await siweMessage.verify({ signature });
      
      const address = fields.data.address;
      
      // 1. Check Redis first
      let expectedNonce = await this.redis.getNonce(address);

      // 2. If not in Redis, check DB
      if (!expectedNonce) {
        const dbNonce = await this.prisma.nonce.findFirst({
          where: { wallet_address: address, nonce: fields.data.nonce },
        });
        if (dbNonce && dbNonce.expires_at > new Date()) {
          expectedNonce = dbNonce.nonce;
        }
      }

      if (!expectedNonce || fields.data.nonce !== expectedNonce) {
        throw new UnauthorizedException('Invalid or expired nonce');
      }

      // 3. Invalidate nonce
      await this.redis.deleteNonce(address);
      await this.prisma.nonce.deleteMany({
        where: { wallet_address: address },
      });

      // 4. Upsert User & WalletAccount
      let user = await this.prisma.user.findFirst({
        where: { walletAccounts: { some: { wallet_address: address } } },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            username: `User_${address.substr(0, 6)}_${Math.floor(Math.random() * 1000)}`,
            walletAccounts: {
              create: { wallet_address: address },
            },
            profile: {
              create: { bio: '', elo_rating: 1000 }
            }
          },
        });
      }

      // 5. Generate Tokens
      const payload = { sub: user.id, address };
      const jti = Math.random().toString(36).substring(2, 15);
      const accessToken = this.jwtService.sign(payload, { expiresIn: '15m', jwtid: jti });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d', jwtid: jti + '_refresh' });

      // 6. Save Session
      await this.prisma.session.create({
        data: {
          user_id: user.id,
          refresh_token: refreshToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      return {
        accessToken,
        refreshToken,
        user,
      };
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('SIWE verification failed');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      
      // Verify session in DB
      const session = await this.prisma.session.findFirst({
        where: { user_id: payload.sub, refresh_token: refreshToken },
      });

      if (!session || session.expires_at < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const newPayload = { sub: payload.sub, address: payload.address };
      const jti = Math.random().toString(36).substring(2, 15);
      const newAccessToken = this.jwtService.sign(newPayload, { expiresIn: '15m', jwtid: jti });
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d', jwtid: jti + '_refresh' });

      // Rotate session
      await this.prisma.session.update({
        where: { id: session.id },
        data: { 
          refresh_token: newRefreshToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, jti: string, refreshToken?: string) {
    // Revoke Session
    if (refreshToken) {
      await this.prisma.session.deleteMany({
        where: { user_id: userId, refresh_token: refreshToken },
      });
    }

    // Blacklist access token
    if (jti) {
      await this.redis.blacklistToken(jti, 15 * 60); // 15 mins
    }
  }
}
