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
import { initializeDb } from 'db';

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter();
  fastifyAdapter.enableCors({});

  await initializeDb();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );

  initializeApp(app);

  await app.listen(8080, '0.0.0.0');
}
bootstrap();
