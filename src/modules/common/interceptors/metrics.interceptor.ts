import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../services/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    const method: string = request.method;
    const route: string = request.route?.path || request.url || 'unknown';

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode ?? 200;
          this.metricsService.recordRequest(
            method,
            route,
            statusCode,
            Date.now() - now,
          );
        },
        error: (error: unknown) => {
          const statusCode =
            error instanceof HttpException
              ? error.getStatus()
              : (context.switchToHttp().getResponse()?.statusCode ?? 500);

          this.metricsService.recordRequest(
            method,
            route,
            statusCode,
            Date.now() - now,
          );
        },
      }),
    );
  }
}
