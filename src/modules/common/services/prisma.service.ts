import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';

export class PrismaKnownError extends Error {
  constructor(
    public readonly code: string,
    public readonly meta: Record<string, unknown> | null,
    public readonly cause: Prisma.PrismaClientKnownRequestError,
  ) {
    super(cause.message);
  }
}

const prismaLogDefinitions = [
  { emit: 'event', level: 'query' },
  'info',
  'warn',
  'error',
] as any;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly logger: PinoLogger) {
    super({
      log: prismaLogDefinitions,
    });

    this.logger.setContext(PrismaService.name);

    (this as any).$on('query', (event: Prisma.QueryEvent) => {
      this.logger.info(
        {
          query: event.query,
          params: event.params,
          durationMs: event.duration,
        },
        'Prisma query executed',
      );
    });

    (this as any).$on('info', (event: Prisma.LogEvent) => {
      this.logger.info(
        {
          message: event.message,
          target: event.target,
        },
        'Prisma info',
      );
    });

    (this as any).$on('warn', (event: Prisma.LogEvent) => {
      this.logger.warn(
        {
          message: event.message,
          target: event.target,
        },
        'Prisma warning',
      );
    });

    (this as any).$on('error', (event: Prisma.LogEvent) => {
      this.logger.error(
        {
          message: event.message,
          target: event.target,
        },
        'Prisma error',
      );
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async safeExecute<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new PrismaKnownError(error.code, error.meta ?? null, error);
      }
      throw error;
    }
  }
}
