import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './modules/app.module';
import { parseServerEnv } from '@executive-match/config';
import { HttpErrorFilter } from './platform/http-error.filter';
import { RequestContextMiddleware } from './platform/request-context.middleware';
import { OriginGuardMiddleware } from './platform/origin-guard.middleware';

async function bootstrap() {
  loadEnv({ path: resolve(process.cwd(), '../../.env') });
  const env = parseServerEnv(process.env);
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.use(helmet());
  app.use(cookieParser());
  app.use(new RequestContextMiddleware().use);
  app.use(new OriginGuardMiddleware(env.WEB_URL).use);
  app.enableCors({ origin: env.WEB_URL, credentials: true });
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new HttpErrorFilter());
  const config = new DocumentBuilder()
    .setTitle('Executive Match API')
    .setVersion('1.0')
    .addCookieAuth('em_session')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  await app.listen(env.API_PORT, '0.0.0.0');
}
void bootstrap();
