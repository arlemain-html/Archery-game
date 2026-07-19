import { Controller, Get, Patch, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Controller('profile')
@UseGuards(AuthGuard('jwt'))
export class ProfileController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getProfile(@Req() req: any) {
    const userId = req.user.userId;
    const profile = await this.prisma.profile.findUnique({
      where: { user_id: userId },
      include: { user: { select: { username: true } } }
    });
    
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    
    return {
      username: profile.user.username,
      elo: profile.elo_rating,
      matchesPlayed: profile.matches_played,
      matchesWon: profile.matches_won,
    };
  }

  @Patch()
  updateProfile(@Req() req: Request) {
    return { message: 'Profile updated', user: req.user };
  }
}
