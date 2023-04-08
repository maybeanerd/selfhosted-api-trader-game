import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/modules/app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { serverInfo } from '@/config/serverInfo';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Set up open api spec generation
  const config = new DocumentBuilder()
    .setTitle(serverInfo.name)
    .setDescription('TODO')
    .setVersion(serverInfo.version)
    .addTag(serverInfo.version)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
