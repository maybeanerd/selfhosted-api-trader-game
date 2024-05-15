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
import {
  contentTypeActivityJson,
  contentTypeActivityStreams,
} from '@/modules/crossroads/activitypub/utils/contentType';

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter();
  fastifyAdapter.enableCors({});

  // Enable parsing activityStream related content-types as JSON
  const fastifyInstance = fastifyAdapter.getInstance();

  fastifyInstance.addContentTypeParser(
    contentTypeActivityJson,
    { parseAs: 'string' },
    fastifyInstance.getDefaultJsonParser('error', 'ignore'),
  );

  fastifyInstance.addContentTypeParser(
    contentTypeActivityStreams,
    { parseAs: 'string' },
    fastifyInstance.getDefaultJsonParser('error', 'ignore'),
  );

  await initializeDb();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );

  initializeApp(app);

  await app.listen(8080, '0.0.0.0');
}
bootstrap();
