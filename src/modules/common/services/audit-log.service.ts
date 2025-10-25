import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AuditAction } from '../enums/audit-action.enum';
import { PrismaService } from './prisma.service';

export interface AuditLogOptions {
  actorUserId?: string | null;
  targetUserId?: string | null;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(action: AuditAction, options: AuditLogOptions): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          actorUserId: options.actorUserId ?? null,
          targetUserId: options.targetUserId ?? null,
          entityType: options.entityType,
          entityId: options.entityId ?? null,
          metadata:
            (options.metadata as Prisma.InputJsonValue | undefined) ??
            undefined,
          ip: options.ip ?? null,
          userAgent: options.userAgent ?? null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to persist audit log ${action}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
        error,
      );
    }
  }
}
