import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly bootTimestamp = new Date();

  getInfo() {
    const version = process.env.npm_package_version ?? '0.0.1';
    const environment = process.env.NODE_ENV ?? 'development';

    return {
      name: 'Weight Loss Clinic API',
      version,
      environment,
      startedAt: this.bootTimestamp.toISOString(),
      uptime: process.uptime(),
    };
  }
}
