import { Module } from '@nestjs/common';
import { SeasonPassController } from './season-pass.controller';
import { SeasonPassService } from './season-pass.service';
import { EIP712SeasonPassSigner } from './eip712-season-pass.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [SeasonPassController],
  providers: [SeasonPassService, EIP712SeasonPassSigner],
})
export class SeasonPassModule {}
