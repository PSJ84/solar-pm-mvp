// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggingExceptionFilter } from './logging-exception.filter';

async function bootstrap() {
  console.log(`[boot] API entry file: ${__filename}`);
  console.log(`[boot] PORT env: ${process.env.PORT ?? 'not set (default 3000)'}`);
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS 설정
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new LoggingExceptionFilter());

  // Swagger 문서
  const config = new DocumentBuilder()
    .setTitle('Solar PM API')
    .setDescription('태양광 프로젝트 관리 MVP API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API Server running on http://0.0.0.0:${port}`);
  console.log(`📚 Swagger docs: http://0.0.0.0:${port}/api/docs`);
}

bootstrap();
