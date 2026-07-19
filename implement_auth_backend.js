const fs = require('fs');
const path = require('path');

const rootDir = 'd:/Gamefi/Archery-dApp';

const files = {
  // ==========================================
  // apps/api dependencies
  // ==========================================
  'apps/api/package.json': `{
  "name": "api",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "tsc",
    "start": "node dist/main",
    "dev": "tsc --watch",
    "lint": "eslint \\"src/**/*.ts\\"",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@archery/types": "workspace:*",
    "@archery/blockchain-sdk": "workspace:*",
    "@archery/config": "workspace:*",
    "@archery/utils": "workspace:*",
    "@nestjs/common": "^10.3.8",
    "@nestjs/core": "^10.3.8",
    "@nestjs/platform-express": "^10.3.8",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/jwt": "^10.2.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "siwe": "^2.3.2",
    "cookie-parser": "^1.4.6",
    "helmet": "^7.1.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@archery/config": "workspace:*",
    "@types/node": "20.19.43",
    "@types/passport-jwt": "^4.0.1",
    "@types/cookie-parser": "^1.4.7",
    "typescript": "5.4.5"
  }
}
`,

  // ==========================================
  // apps/api NestJS setup
  // ==========================================
  'apps/api/src/main.ts': `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({ origin: 'http://localhost:3000', credentials: true });
  app.use(helmet());
  app.use(cookieParser());
  
  await app.listen(3001);
  console.log('API running on port 3001');
}
bootstrap();
`,
  'apps/api/src/app.module.ts': `import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [AuthModule, ProfileModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
`,
  'apps/api/src/auth/auth.module.ts': `import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
`,
  'apps/api/src/auth/auth.controller.ts': `import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('nonce')
  async getNonce(@Body('address') address: string) {
    const nonce = await this.authService.generateNonce(address);
    return { nonce };
  }

  @Post('login')
  async login(@Body() body: { message: string; signature: string }) {
    return this.authService.verifySiweAndLogin(body.message, body.signature);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  async logout(@Req() req: Request) {
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Req() req: Request) {
    return req.user;
  }
}
`,
  'apps/api/src/auth/auth.service.ts': `import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SiweMessage, generateNonce } from 'siwe';

@Injectable()
export class AuthService {
  // Mock store for nonces & users for foundational implementation
  private nonces = new Map<string, string>();
  private users = new Map<string, any>();

  constructor(private jwtService: JwtService) {}

  async generateNonce(address: string): Promise<string> {
    const nonce = generateNonce();
    this.nonces.set(address, nonce);
    return nonce;
  }

  async verifySiweAndLogin(messageStr: string, signature: string) {
    try {
      const siweMessage = new SiweMessage(messageStr);
      const fields = await siweMessage.verify({ signature });
      
      const expectedNonce = this.nonces.get(fields.data.address);
      if (fields.data.nonce !== expectedNonce) {
        throw new UnauthorizedException('Invalid nonce');
      }
      // Invalidate nonce
      this.nonces.delete(fields.data.address);

      // Bootstrap user if not exists
      let user = this.users.get(fields.data.address);
      if (!user) {
        user = {
          id: Math.random().toString(36).substr(2, 9),
          walletAddress: fields.data.address,
          username: \`User_\${fields.data.address.substr(0, 6)}\`,
          level: 1,
          experience: 0
        };
        this.users.set(fields.data.address, user);
      }

      const payload = { sub: user.id, address: user.walletAddress };
      
      return {
        accessToken: this.jwtService.sign(payload),
        refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
        user,
      };
    } catch (e) {
      throw new UnauthorizedException('SIWE verification failed');
    }
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const newPayload = { sub: payload.sub, address: payload.address };
      return {
        accessToken: this.jwtService.sign(newPayload),
        refreshToken: this.jwtService.sign(newPayload, { expiresIn: '7d' }),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
`,
  'apps/api/src/auth/jwt.strategy.ts': `import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, address: payload.address };
  }
}
`,
  'apps/api/src/profile/profile.module.ts': `import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';

@Module({
  controllers: [ProfileController],
})
export class ProfileModule {}
`,
  'apps/api/src/profile/profile.controller.ts': `import { Controller, Get, Patch, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('profile')
@UseGuards(AuthGuard('jwt'))
export class ProfileController {
  @Get()
  getProfile(@Req() req: Request) {
    return { message: 'Profile data placeholder', user: req.user };
  }

  @Patch()
  updateProfile(@Req() req: Request) {
    return { message: 'Profile updated', user: req.user };
  }
}
`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(rootDir, filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}
console.log('Backend Auth implementation scaffolded.');
