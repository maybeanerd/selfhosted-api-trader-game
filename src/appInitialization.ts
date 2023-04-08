import { INestApplication, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { serverInfo } from './config/serverInfo';

export function initializeApp(app: INestApplication) {
  // Set up versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Set up open api spec generation
  const config = new DocumentBuilder()
    .setTitle(serverInfo.name)
    .setDescription(serverInfo.desciption)
    .setVersion(serverInfo.version)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('spec', app, document);
}
