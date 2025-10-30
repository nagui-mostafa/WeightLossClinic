import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from './modules/config';
import { CommonModule } from './modules/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RecordsModule } from './modules/records/records.module';
import { AdminModule } from './modules/admin/admin.module';
import { MailModule } from './modules/mail/mail.module';
import { HealthModule } from './modules/health/health.module';
import { BlogsModule } from './modules/blogs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import type { Request } from 'express';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          level: configService.get<string>('LOG_LEVEL', 'info'),
          transport: (() => {
            const isDev =
              configService.get<string>('NODE_ENV', 'development') ===
              'development';
            if (!isDev) {
              return undefined;
            }
            try {
              // Resolve optional dependency if present; falls back silently when missing.
              const prettyPath = require.resolve('pino-pretty');
              return {
                target: prettyPath,
                options: {
                  colorize: true,
                  translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
                },
              };
            } catch {
              return undefined;
            }
          })(),
          autoLogging: {
            ignore: () => false,
          },
          customLogLevel: (req, res, err) => {
            if (res.statusCode >= 500 || err) {
              return 'error';
            }
            if (res.statusCode >= 400) {
              return 'warn';
            }
            return 'info';
          },
          redact: {
            paths: ['req.headers.authorization', 'req.body.password'],
            remove: true,
          },
          customProps: (req) => {
            const request = req as Request & {
              requestId?: string;
              user?: { id?: string; role?: string };
            };
            return {
              requestId: request.requestId,
              userId: request.user?.id,
              role: request.user?.role,
            };
          },
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const windowMs = configService.get<number>(
          'RATE_LIMIT_WINDOW_MS',
          900_000,
        );
        const limit = configService.get<number>('RATE_LIMIT_MAX', 100);

        return {
          throttlers: [
            {
              name: 'global',
              ttl: Math.ceil(windowMs / 1000),
              limit,
            },
          ],
        };
      },
    }),
    CommonModule,
    HealthModule,
    MailModule,
    AuthModule,
    UsersModule,
    RecordsModule,
    AdminModule,
    BlogsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
