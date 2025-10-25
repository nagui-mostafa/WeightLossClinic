import { Injectable } from '@nestjs/common';

interface MetricKey {
  method: string;
  route: string;
  statusCode: number;
}

interface MetricBucket {
  count: number;
  totalDurationMs: number;
}

@Injectable()
export class MetricsService {
  private readonly metrics = new Map<string, MetricBucket>();
  private readonly startTime = Date.now();

  recordRequest(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number,
  ): void {
    const key = this.toKey({ method, route, statusCode });
    const bucket = this.metrics.get(key) ?? { count: 0, totalDurationMs: 0 };
    bucket.count += 1;
    bucket.totalDurationMs += durationMs;
    this.metrics.set(key, bucket);
  }

  async getMetrics(): Promise<string> {
    const lines: string[] = [
      '# HELP http_request_total Total number of HTTP requests received',
      '# TYPE http_request_total counter',
    ];

    for (const [key, bucket] of this.metrics.entries()) {
      const { method, route, statusCode } = this.fromKey(key);
      lines.push(
        `http_request_total{method="${method}",route="${route}",status_code="${statusCode}"} ${bucket.count}`,
      );
    }

    lines.push(
      '# HELP http_request_duration_seconds_sum Total request duration in seconds',
      '# TYPE http_request_duration_seconds_sum gauge',
    );

    for (const [key, bucket] of this.metrics.entries()) {
      const { method, route, statusCode } = this.fromKey(key);
      const seconds = bucket.totalDurationMs / 1000;
      lines.push(
        `http_request_duration_seconds_sum{method="${method}",route="${route}",status_code="${statusCode}"} ${seconds}`,
      );
    }

    const uptimeSeconds = (Date.now() - this.startTime) / 1000;
    lines.push('# HELP process_uptime_seconds Process uptime in seconds');
    lines.push('# TYPE process_uptime_seconds gauge');
    lines.push(`process_uptime_seconds ${uptimeSeconds}`);

    return lines.join('\n');
  }

  private toKey({ method, route, statusCode }: MetricKey): string {
    return `${method}::${route}::${statusCode}`;
  }

  private fromKey(key: string): MetricKey {
    const [method, route, status] = key.split('::');
    return { method, route, statusCode: Number(status) };
  }
}
