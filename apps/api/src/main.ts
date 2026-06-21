import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import type { AppConfig } from './config/env.config';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(ConfigService<AppConfig, true>);

  // Global validation pipe — strips unknown fields, whitelist only known DTO props
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter — consistent error shape across all endpoints
  app.useGlobalFilters(new GlobalExceptionFilter());

  // CORS — configured, not hardcoded
  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }),
    methods: ['GET'],
    allowedHeaders: ['Content-Type'],
  });

  // API prefix
  app.setGlobalPrefix('api');

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  logger.log(`cascade-map API running on port ${port}`);
}

bootstrap().catch((err: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.fatal('Failed to start application', err instanceof Error ? err.stack : String(err));
  process.exit(1);
});
