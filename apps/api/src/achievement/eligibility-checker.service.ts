import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EligibilityChecker {
  constructor(private prisma: PrismaService) {}

  async checkEligibility(userId: string, achievementId: number): Promise<boolean> {
    // Basic eligibility logic (e.g. at least 1 match won)
    const profile = await this.prisma.profile.findUnique({
      where: { user_id: userId }
    });

    const matchesWon = profile?.matches_won || 0;

    if (achievementId === 1) { 
      return matchesWon >= 1; 
    }
    if (achievementId === 2) {
      return false; // Not implemented yet
    }
    if (achievementId === 3) {
      return (profile?.matches_played || 0) >= 100;
    }
    if (achievementId === 4) {
      return true; // Wallet connected
    }

    return false;
  }
}
