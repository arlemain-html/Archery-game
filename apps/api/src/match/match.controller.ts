import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MatchService } from './match.service';
import { ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard, AuthGuard('jwt'))
@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post('find')
  async findMatch(@Req() req: any) {
    return this.matchService.findMatch(req.user.userId);
  }

  @Post('submit')
  async submitMatch(
    @Req() req: any,
    @Body('matchId') matchId: string,
    @Body('score') score: number,
    @Body('accuracy') accuracy: number,
  ) {
    return this.matchService.submitMatch(req.user.userId, matchId, score, accuracy);
  }
}
