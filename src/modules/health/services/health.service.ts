import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { MetricsService } from '../../common/services/metrics.service';

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
}

export interface ReadinessStatus extends HealthStatus {
  checks: {
    database: {
      status: 'ok' | 'error';
      latencyMs?: number;
      message?: string;
    };
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService,
  ) {}

  getLiveness(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  async getReadiness(): Promise<ReadinessStatus> {
    const startedAt = Date.now();
    let databaseStatus: ReadinessStatus['checks']['database'];

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseStatus = {
        status: 'ok',
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      databaseStatus = {
        status: 'error',
        latencyMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    return {
      status: databaseStatus.status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: databaseStatus,
      },
    };
  }

  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
