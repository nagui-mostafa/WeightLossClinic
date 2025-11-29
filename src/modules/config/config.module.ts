import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from '@hapi/joi';
import configuration from './configuration';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
      validationSchema: Joi.object({
        // Application
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),

        // Database
        DATABASE_URL: Joi.string().required(),

        // JWT
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        ACCESS_TOKEN_TTL: Joi.string().default('3d'),
        REFRESH_TOKEN_TTL: Joi.string().default('14d'),
        PASSWORD_RESET_TOKEN_TTL: Joi.string().default('1h'),
        EMAIL_VERIFICATION_TOKEN_TTL: Joi.string().default('24h'),

        // Mail
        MAIL_HOST: Joi.string().default('localhost'),
        MAIL_PORT: Joi.number().default(587),
        MAIL_USER: Joi.string().allow('').default(''),
        MAIL_PASS: Joi.string().allow('').default(''),
        MAIL_FROM: Joi.string().email().default('noreply@weightlossclinic.com'),

        // CORS
        CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
        CLIENT_APP_URL: Joi.string().uri().optional(),

        // Rate Limiting
        RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
        RATE_LIMIT_MAX: Joi.number().default(100),

        // Logging
        LOG_LEVEL: Joi.string()
          .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
          .default('info'),

        // Features
        EMAIL_VERIFICATION_ENABLED: Joi.boolean().default(false),
        PROM_ENABLED: Joi.boolean().default(true),

        // Object storage
        OBJECT_STORAGE_DRIVER: Joi.string()
          .valid('minio', 's3')
          .default('minio'),
        OBJECT_STORAGE_ENDPOINT: Joi.string()
          .allow('')
          .default('http://localhost:9000'),
        OBJECT_STORAGE_REGION: Joi.string().default('us-east-1'),
        OBJECT_STORAGE_BUCKET: Joi.string().default('weight-loss-media'),
        OBJECT_STORAGE_ACCESS_KEY: Joi.string().allow('').default(''),
        OBJECT_STORAGE_SECRET_KEY: Joi.string().allow('').default(''),
        OBJECT_STORAGE_FORCE_PATH_STYLE: Joi.boolean().default(true),
        OBJECT_STORAGE_USE_SSL: Joi.boolean().default(false),
        OBJECT_STORAGE_PUBLIC_BASE_URL: Joi.string().allow('').optional(),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
