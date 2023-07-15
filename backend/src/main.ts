import { config } from 'dotenv';
// Load environment variables from .env file
config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/modules/app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { initializeApp } from '@/appInitialization';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  initializeApp(app);

  await app.listen(3000, '0.0.0.0');
}
bootstrap();
