import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getTopPlayers(limit: number = 50) {
    const topProfiles = await this.prisma.profile.findMany({
      orderBy: { elo_rating: 'desc' },
      take: limit,
      include: { user: { select: { username: true } } }
    });

    return topProfiles.map((p: any, index: number) => {
      const matchesPlayed = p.matches_played || 0;
      const matchesWon = p.matches_won || 0;
      const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;
      
      return {
        rank: index + 1,
        username: p.user.username,
        elo: p.elo_rating,
        matchesPlayed,
        matchesWon,
        winRate,
        avatar: p.avatar_url || '/assets/avatars/default.png'
      };
    });
  }
}
