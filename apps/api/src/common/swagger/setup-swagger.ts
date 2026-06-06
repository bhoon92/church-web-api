import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';
import { ConfigProvider } from '@src/config';

export async function setupSwagger(app: INestApplication): Promise<void> {
  const config = ConfigProvider;
  if (config.stage === 'production') {
    return;
  }
  const { version } = await import('../../../package.json');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('WEB API')
    .setVersion(version)
    .addBasicAuth(
      {
        type: 'http',
        scheme: 'bearer',
        name: 'access-token',
      },
      'access-token' // 참조 이름
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        name: 'access-token',
      },
      'access-token'
    )
    .build();

  const swaggerCustomOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
    },
  };

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document, swaggerCustomOptions);
}
