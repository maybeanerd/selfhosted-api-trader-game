import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/modules/app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { initializeApp } from '@/appInitialization';

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
    return request(app.getHttpServer())
      .delete('/v1/trade')
      .send({ type: 'wood', amount: 69 })
      .expect(200)
      .expect({ type: 'wood', amount: 0 });
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
      .expect('0');
  });
});
