import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/modules/app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { initializeApp } from '@/appInitialization';
import { randomUUID } from 'crypto';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    initializeApp(app);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/v1/trade (DELETE)', () => {
    const id = randomUUID();
    return request(app.getHttpServer())
      .delete('/v1/trade')
      .send({ id })
      .expect(200)
      .expect({ id, requestedResources: [], offeredResources: [] });
  });

  it('/v1/trade (DELETE)', () => {
    return request(app.getHttpServer())
      .delete('/v1/trade')
      .send({ type: 'wooood', amount: 69 })
      .expect(400);
  });

  it('/v1/resource/wood (GET)', () => {
    return request(app.getHttpServer())
      .get('/v1/resource/wood')
      .expect(200)
      .expect({ amount: 0, accumulationPerTick: 0 });
  });
});
