import { Injectable } from '@nestjs/common';
import { PrismaService, buildPaginationMeta, AuditAction } from '../../common';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { ListAuditLogsQueryDto } from '../dto/list-audit-logs-query.dto';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';
import { AdminStatsResponseDto } from '../dto/stats-response.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAuditLogs(
    query: ListAuditLogsQueryDto,
  ): Promise<PaginatedResult<AuditLogResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (query.actorUserId) {
      where['actorUserId'] = query.actorUserId;
    }

    if (query.action) {
      where['action'] = query.action;
    }

    if (query.startDate || query.endDate) {
      where['createdAt'] = {};
      if (query.startDate) {
        where['createdAt']['gte'] = new Date(query.startDate);
      }
      if (query.endDate) {
        where['createdAt']['lte'] = new Date(query.endDate);
      }
    }

    const orderBy = this.parseSort(query.sort);

    const [totalItems, logs] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return {
      data: logs.map((log) => this.toAuditDto(log)),
      meta: buildPaginationMeta(query, totalItems),
    };
  }

  async getStats(): Promise<AdminStatsResponseDto> {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalRecords,
      newUsers7,
      newUsers30,
      rec7,
      rec30,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.record.count(),
      this.prisma.user.count({ where: { createdAt: { gte: last7Days } } }),
      this.prisma.user.count({ where: { createdAt: { gte: last30Days } } }),
      this.prisma.record.count({ where: { createdAt: { gte: last7Days } } }),
      this.prisma.record.count({ where: { createdAt: { gte: last30Days } } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalRecords,
      newUsersLast7Days: newUsers7,
      newUsersLast30Days: newUsers30,
      recordsCreatedLast7Days: rec7,
      recordsCreatedLast30Days: rec30,
    };
  }

  private toAuditDto(log: {
    id: string;
    action: string;
    actorUserId: string | null;
    targetUserId: string | null;
    entityType: string;
    entityId: string | null;
    metadata: any;
    ip: string | null;
    userAgent: string | null;
    createdAt: Date;
  }): AuditLogResponseDto {
    return {
      id: log.id,
      action: log.action as AuditAction,
      actorUserId: log.actorUserId,
      targetUserId: log.targetUserId,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata as Record<string, unknown>,
      ip: log.ip,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
    };
  }

  private parseSort(sort?: string) {
    if (!sort) {
      return { createdAt: 'desc' } as const;
    }

    const [field, direction] = sort.split(':');
    const allowed = new Set(['createdAt']);

    if (!field || !allowed.has(field)) {
      return { createdAt: 'desc' } as const;
    }

    const dir = direction?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    return { [field]: dir } as Record<string, 'asc' | 'desc'>;
  }
}
