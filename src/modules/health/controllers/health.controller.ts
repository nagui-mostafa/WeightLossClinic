import { Controller, Get, Header } from '@nestjs/common';
import { HealthService } from '../services/health.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  @Public()
  getHealth() {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @Public()
  getReadiness() {
    return this.healthService.getReadiness();
  }

  @Get('metrics')
  @Public()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    return this.healthService.getMetrics();
  }
}
