import { mkdirSync } from 'fs';
import { join } from 'path';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { setupSwagger } from './config/swagger.config';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const prismaService = app.get(PrismaService);
  const port = configService.get<number>('PORT', 3011);
  const uploadDir = configService.get<string>('UPLOAD_DIR', 'uploads');
  const appUrl = configService.get<string>('APP_URL');
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  mkdirSync(join(process.cwd(), uploadDir, 'products'), { recursive: true });

  app.setGlobalPrefix('api');
  app.useStaticAssets(join(process.cwd(), uploadDir), {
    prefix: '/uploads/',
  });
  app.enableCors({
    origin: [appUrl, frontendUrl].filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    ),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new PrismaClientExceptionFilter());

  setupSwagger(app);
  prismaService.enableShutdownHooks(app);
  await app.listen(port);
}
void bootstrap();
