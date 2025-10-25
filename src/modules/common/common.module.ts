import { Module, Global } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaService } from './services/prisma.service';
import { RolesGuard } from './guards/roles.guard';
import { RequestIdInterceptor } from './interceptors/request-id.interceptor';
import {
  HttpExceptionFilter,
  AllExceptionsFilter,
} from './filters/http-exception.filter';
import { MetricsService } from './services/metrics.service';
import { MetricsInterceptor } from './interceptors/metrics.interceptor';
import { AuditLogService } from './services/audit-log.service';
import { PasswordService } from './services/password.service';

@Global()
@Module({
  providers: [
    PrismaService,
    RolesGuard,
    MetricsService,
    AuditLogService,
    PasswordService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestIdInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [
    PrismaService,
    RolesGuard,
    MetricsService,
    AuditLogService,
    PasswordService,
  ],
})
export class CommonModule {}
