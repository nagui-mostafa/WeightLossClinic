import { Controller, Get, Header } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService } from '../services/health.service';
import { Public } from '../../common/decorators/public.decorator';
import type { HealthStatus, ReadinessStatus } from '../services/health.service';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({
    description: 'Basic liveness information',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'], example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: {
          type: 'number',
          description: 'Seconds the process has been up',
        },
      },
    },
  })
  getHealth() {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness probe (DB checked)' })
  @ApiOkResponse({
    description: 'Readiness including database check',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'], example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number' },
        checks: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['ok', 'error'] },
                latencyMs: { type: 'number', example: 12 },
                message: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
    },
  })
  getReadiness() {
    return this.healthService.getReadiness();
  }

  @Get('metrics')
  @Public()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Prometheus metrics' })
  @ApiOkResponse({
    description: 'Prometheus text exposition format',
    content: { 'text/plain': { schema: { type: 'string' } } },
  })
  async getMetrics(): Promise<string> {
    return this.healthService.getMetrics();
  }
}
