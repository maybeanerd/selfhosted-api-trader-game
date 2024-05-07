import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { serverInfo } from './config/serverInfo';
import { apiBasePath } from '@/config/apiPaths';

export function initializeApp(app: INestApplication) {
  // Set up global /api prefix
  app.setGlobalPrefix(apiBasePath);

  // Set up versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Set up validation
  app.useGlobalPipes(
    new ValidationPipe({
      // Strip received data to include only defined attributes
      whitelist: true,
      // Transforms received data to the defined type
      transform: true,
    }),
  );

  // Set up open api spec generation
  const config = new DocumentBuilder()
    .setTitle(serverInfo.name)
    .setDescription(serverInfo.desciption)
    .setVersion(serverInfo.version)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('spec', app, document);
}
