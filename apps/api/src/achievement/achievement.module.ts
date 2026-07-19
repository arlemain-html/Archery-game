import { Module } from '@nestjs/common';
import { EligibilityChecker } from './eligibility-checker.service';
import { EIP712Signer } from './eip712-signer.service';
import { AchievementService } from './achievement.service';
import { AchievementController } from './achievement.controller';

@Module({
  controllers: [AchievementController],
  providers: [EligibilityChecker, EIP712Signer, AchievementService],
  exports: [AchievementService],
})
export class AchievementModule {}
