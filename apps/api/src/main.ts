import { NestFactory } from '@nestjs/core';
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
