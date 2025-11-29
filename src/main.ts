import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { JsonBodyParserPipe } from './modules/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const swaggerCdnOrigins = [
    'https://cdnjs.cloudflare.com',
    'https://cdn.jsdelivr.net',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];


  // Use Pino logger
  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);
  const objectStorageEndpoint =
    configService.get<string>('OBJECT_STORAGE_ENDPOINT') ||
    'http://127.0.0.1:9100';

  app.use(
    '/minio',
    createProxyMiddleware({
      target: objectStorageEndpoint,
      changeOrigin: true,
      pathRewrite: { '^/minio': '' },
    }),
  );

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", ...swaggerCdnOrigins],
          imgSrc: ["'self'", 'data:', ...swaggerCdnOrigins],
          styleSrc: ["'self'", "'unsafe-inline'", ...swaggerCdnOrigins],
          fontSrc: ["'self'", 'data:', ...swaggerCdnOrigins],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            ...swaggerCdnOrigins,
          ],
          'upgrade-insecure-requests': null,
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS
  const corsOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || [
    'http://localhost:3000',
    'https://joeymed.com',
  ];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new JsonBodyParserPipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Weight Loss Clinic API')
    .setDescription(
      'Secure REST backend for managing patients & medication records',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('records', 'Medication records')
    .addTag('admin', 'Admin operations')
    .addTag('health', 'Health & monitoring')
    .addTag('weight-loss-products', 'Weight loss product catalog')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/docs`);
}

void bootstrap();
