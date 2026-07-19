import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EIP712SeasonPassSigner } from './eip712-season-pass.service';
import { randomBytes } from 'crypto';

import { SEASON_PASS_LEVELS } from '@archery/config';

@Injectable()
export class SeasonPassService {
  constructor(
    private prisma: PrismaService,
    private eip712Signer: EIP712SeasonPassSigner
  ) {}

  async getSeasonPassData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { seasonPassClaims: true }
    });

    if (!user) throw new BadRequestException('User not found');

    return {
      xp: user.xp,
      level: user.level,
      claimedLevels: user.seasonPassClaims.map(claim => claim.level)
    };
  }

  async claimReward(userId: string, level: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { seasonPassClaims: true, walletAccounts: true }
    });

    if (!user) throw new BadRequestException('User not found');
    
    const levelConfig = SEASON_PASS_LEVELS.find((l: any) => l.level === level);
    if (!levelConfig) throw new BadRequestException('Invalid level');

    if (user.xp < levelConfig.xp) {
      throw new BadRequestException('Not enough XP to claim this level');
    }

    if (user.seasonPassClaims.some(c => c.level === level)) {
      throw new BadRequestException('Level already claimed');
    }

    let isWeb3 = levelConfig.isWeb3;
    let signature = null;
    let nonce = null;
    let rewardId = levelConfig.rewardId;

    if (isWeb3) {
      const wallet = user.walletAccounts[0]?.wallet_address;
      if (!wallet) throw new BadRequestException('Wallet not linked');

      nonce = parseInt(randomBytes(4).toString('hex'), 16);
      
      await this.prisma.nonce.create({
        data: {
          nonce: nonce.toString(),
          wallet_address: wallet,
          expires_at: new Date(Date.now() + 15 * 60 * 1000)
        }
      });

      signature = await this.eip712Signer.signRewardClaim(wallet, level, levelConfig.skuId!, nonce);
    }

    // Record claim (for off-chain, we record immediately. For on-chain, we should ideally record after event, but for simplicity we record it now pending tx)
    await this.prisma.seasonPassClaim.create({
      data: {
        user_id: userId,
        level,
        reward_id: rewardId
      }
    });

    return {
      success: true,
      isWeb3,
      signature,
      nonce,
      rewardId
    };
  }
}
