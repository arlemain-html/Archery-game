import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { contractAddresses } from '@archery/contracts';

@Injectable()
export class EIP712SeasonPassSigner {
  private wallet: ethers.Wallet;
  private domain: Record<string, any>;

  constructor(private configService: ConfigService) {
    const privateKey = this.configService.get<string>('BACKEND_PRIVATE_KEY');
    if (!privateKey) throw new Error('BACKEND_PRIVATE_KEY not set');
    
    this.wallet = new ethers.Wallet(privateKey);
    
    // EIP712 Domain for SeasonPassReward contract
    this.domain = {
      name: 'ArcheryGame',
      version: '1',
      chainId: 8453, // Base Mainnet
      verifyingContract: contractAddresses.base_mainnet.SeasonPassReward || '0x0000000000000000000000000000000000000000', 
    };
  }

  async signRewardClaim(userWallet: string, level: number, skuId: number, nonce: number): Promise<string> {
    const types = {
      ClaimReward: [
        { name: 'level', type: 'uint256' },
        { name: 'skuId', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
      ],
    };

    const value = {
      level,
      skuId,
      nonce,
    };

    try {
      return await this.wallet.signTypedData(this.domain, types, value);
    } catch (e) {
      console.error(e);
      throw new InternalServerErrorException('Failed to sign season pass claim');
    }
  }

  updateContractAddress(address: string) {
    this.domain.verifyingContract = address;
  }
}
