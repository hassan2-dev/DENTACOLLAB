import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.setGlobalPrefix('api/v1');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const webPublicUrl = (process.env.WEB_PUBLIC_URL ?? '').replace(/\/$/, '');
  if (webPublicUrl && !corsOrigins.includes(webPublicUrl)) {
    corsOrigins.push(webPublicUrl);
  }

  const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';

  app.enableCors({
    origin: (origin, callback) => {
      // Same-origin / non-browser clients (curl, server-to-server)
      if (!origin) return callback(null, true);
      if (corsOrigins.length === 0) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      // Local Vite apps (web :5173, admin :5174, previews)
      if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });
  console.log(
    corsOrigins.length
      ? `CORS origins: ${corsOrigins.join(', ')}${isDev ? ' (+ localhost in dev)' : ''}`
      : 'CORS origins: reflect all (CORS_ORIGINS empty)',
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('DentaCollab API')
    .setDescription('REST API for DentaCollab Digital Dentistry Academy')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`DentaCollab API listening on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
