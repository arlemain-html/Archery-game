import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class EIP712Signer {
  private wallet: ethers.Wallet;
  private domain: Record<string, any>;

  constructor(private configService: ConfigService) {
    const privateKey = this.configService.get<string>('BACKEND_PRIVATE_KEY');
    if (!privateKey) throw new Error('BACKEND_PRIVATE_KEY not set');
    
    this.wallet = new ethers.Wallet(privateKey);
    
    // EIP712 Domain for AchievementSBT contract
    this.domain = {
      name: 'ArcheryGame',
      version: '1',
      chainId: 8453, // Base Mainnet
      verifyingContract: this.configService.get<string>('NEXT_PUBLIC_SBT_CONTRACT') || '0x5FbDB2315678afecb367f032d93F642f64180aa3', 
    };
  }

  async signAchievementClaim(userWallet: string, achievementId: number, nonce: number): Promise<string> {
    const types = {
      ClaimAchievement: [
        { name: 'user', type: 'address' },
        { name: 'achievementId', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
      ],
    };

    const value = {
      user: userWallet,
      achievementId,
      nonce,
    };

    try {
      return await this.wallet.signTypedData(this.domain, types, value);
    } catch (e) {
      console.error(e);
      throw new InternalServerErrorException('Failed to sign achievement claim');
    }
  }
}
