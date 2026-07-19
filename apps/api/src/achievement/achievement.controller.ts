import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AchievementService } from './achievement.service';
import { ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard, AuthGuard('jwt'))
@Controller('achievement')
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  @Post('claim')
  async claimAchievement(@Req() req: any, @Body('achievementId') achievementId: number) {
    const user = req.user;
    return this.achievementService.processClaim(user.userId, user.address, achievementId);
  }
}
