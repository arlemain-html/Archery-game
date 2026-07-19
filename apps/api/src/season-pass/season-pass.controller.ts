import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { SeasonPassService } from './season-pass.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('season-pass')
@UseGuards(AuthGuard('jwt'))
export class SeasonPassController {
  constructor(private readonly seasonPassService: SeasonPassService) {}

  @Get()
  async getSeasonPassData(@Req() req: any) {
    return this.seasonPassService.getSeasonPassData(req.user.userId);
  }

  @Post('claim')
  async claimReward(@Req() req: any, @Body() body: { level: number }) {
    return this.seasonPassService.claimReward(req.user.userId, body.level);
  }
}
