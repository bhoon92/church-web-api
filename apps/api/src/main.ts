import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSources } from './database/data-sources';
import { NestExpressApplication } from '@nestjs/platform-express';
import { setValidationPipe } from './common/validation-pipe';
import { AllExceptionsFilter } from './exception/exception.filter';
import cookieParser from 'cookie-parser';
import { setupCors } from './common/setup-cors';
import { setTransformInterceptor } from './common/transform-interceptor';
import { setupSwagger } from './common/swagger/setup-swagger';

async function bootstrap() {
  await DataSources.instance.initialize();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(cookieParser());

  setupCors(app);
  setValidationPipe(app);
  setTransformInterceptor(app);
  await setupSwagger(app);
  await app.listen(3000);
  console.log(`Server is running on port ${3000}`);
}
bootstrap();
