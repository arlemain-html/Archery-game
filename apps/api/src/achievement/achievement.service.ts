import { Injectable, BadRequestException } from '@nestjs/common';
import { EligibilityChecker } from './eligibility-checker.service';
import { EIP712Signer } from './eip712-signer.service';

@Injectable()
export class AchievementService {
  constructor(
    private eligibilityChecker: EligibilityChecker,
    private eip712Signer: EIP712Signer,
  ) {}

  async processClaim(userId: string, userWallet: string, achievementId: number) {
    const isEligible = await this.eligibilityChecker.checkEligibility(userId, achievementId);
    
    if (!isEligible) {
      throw new BadRequestException('User is not eligible for this achievement');
    }

    // In a real app, check if already claimed in DB before signing
    // Generate a nonce (using timestamp + random for MVP)
    const nonce = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 100000);
    
    const signature = await this.eip712Signer.signAchievementClaim(userWallet, achievementId, nonce);
    
    return {
      achievementId,
      nonce,
      signature,
      message: 'Claim signature generated successfully. Submit this to the smart contract.'
    };
  }
}
