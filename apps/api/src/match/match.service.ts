import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MatchService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findMatch(userId: string) {
    // Stub Matchmaking Logic
    const match = await this.prisma.match.create({
      data: {
        season_id: 'season_1',
        match_type: 'PvP',
        status: 'Active',
      }
    });

    // Add Player 1
    await this.prisma.matchPlayer.create({
      data: {
        match_id: match.id,
        user_id: userId,
        is_ghost: false,
      }
    });

    // Mock finding a Ghost Player
    const ghostScore = Math.floor(Math.random() * 30);
    await this.prisma.matchPlayer.create({
      data: {
        match_id: match.id,
        is_ghost: true,
        score_achieved: ghostScore,
      }
    });

    return match;
  }

  async submitMatch(userId: string, matchId: string, score: number, accuracy: number) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { players: true }
    });

    if (!match) throw new BadRequestException('Match not found');

    const player = match.players.find((p: any) => p.user_id === userId);
    if (!player) throw new BadRequestException('Player not in this match');

    const ghostPlayer = match.players.find((p: any) => p.is_ghost);
    const ghostScore = ghostPlayer?.score_achieved ?? 0;

    let isWin = score >= 25;
    let isDraw = false;

    let eloChange = 0;
    if (score >= 25) {
      // High scores gain more ELO
      eloChange = Math.floor((score - 20) * 0.8);
    } else {
      // Low scores lose ELO based on how far below 25 they are
      eloChange = Math.floor((score - 25) * 0.5);
    }

    const xpGained = isWin ? 500 : (isDraw ? 250 : 100);

    // Update Player Score
    await this.prisma.matchPlayer.update({
      where: { id: player.id },
      data: {
        score_achieved: score,
        accuracy_percentage: accuracy,
        elo_change: eloChange,
      }
    });

    await this.prisma.match.update({
      where: { id: matchId },
      data: { status: 'Finished', ended_at: new Date() }
    });

    // Update XP in User
    await this.prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: xpGained } }
    });

    // Update ELO and Stats in Profile & Leaderboard
    const profile = await this.prisma.profile.findUnique({ where: { user_id: userId } });
    if (profile) {
      const newElo = profile.elo_rating + eloChange;
      
      await this.prisma.profile.update({
        where: { user_id: userId },
        data: { 
          elo_rating: newElo,
          matches_played: { increment: 1 },
          matches_won: { increment: isWin ? 1 : 0 }
        }
      });
      
      const redisClient = this.redis.getClient();
      await redisClient.zadd('leaderboard:season_1', newElo, userId);
    }

    this.eventEmitter.emit('match.finished', { userId, matchId, score, isWin });

    return { 
      success: true, 
      eloChange, 
      xpGained, 
      isWin, 
      isDraw, 
      ghostScore 
    };
  }
}
