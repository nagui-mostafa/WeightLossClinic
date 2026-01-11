import { Injectable } from '@nestjs/common';
import {
  PrismaService,
  buildPaginationMeta,
  AuditAction,
  Role,
} from '../../common';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { ListAuditLogsQueryDto } from '../dto/list-audit-logs-query.dto';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';
import { AdminStatsResponseDto } from '../dto/stats-response.dto';
import { AdminAnalyticsResponseDto } from '../dto/analytics-response.dto';
import { buildActiveRecordFilter } from '../../users/utils/patient-status.util';
import { Workbook } from 'exceljs';
import { ListNotificationsQueryDto } from '../dto/list-notifications-query.dto';
import { AdminNotificationDto } from '../dto/admin-notification.dto';
import { NotificationStatus } from '@prisma/client';

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
    const metrics = await this.computePatientMetrics();
    return {
      totalUsers: metrics.totalUsers,
      newUsers: metrics.newUsers,
      activePatientsLast30Days: metrics.activePatientsLast30Days,
      activePatients: metrics.activePatients,
      orders: metrics.orders,
      conversion: metrics.conversion,
      reminderEfficacy: metrics.reminderEfficacy,
      closedReminders: metrics.closedReminders,
      totalReminders: metrics.totalReminders,
      totalRevenue: metrics.totalRevenue,
    };
  }

  async getAnalytics(): Promise<AdminAnalyticsResponseDto> {
    const metrics = await this.computePatientMetrics();
    return {
      totalPatients: metrics.totalUsers,
      newPatientsLast7Days: metrics.newUsers,
      activePatientsLast30Days: metrics.activePatientsLast30Days,
      ordersLast30Days: metrics.orders,
      signupToPurchaseConversion: metrics.conversion,
      reminderEfficacy: metrics.reminderEfficacy,
      closedReminders: metrics.closedReminders,
      totalReminders: metrics.totalReminders,
    };
  }

  async listNotifications(
    query: ListNotificationsQueryDto,
  ): Promise<PaginatedResult<AdminNotificationDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (query.status) {
      where['status'] = query.status;
    }
    if (query.email) {
      where['user'] = {
        ...(where['user'] ?? {}),
        email: { contains: query.email, mode: 'insensitive' },
      };
    }
    if (query.phone) {
      where['user'] = {
        ...(where['user'] ?? {}),
        phone: { contains: query.phone },
      };
    }

    const orderBy = this.parseNotificationSort(query.sort);

    const [totalItems, rows] = await this.prisma.$transaction([
      this.prisma.userNotification.count({ where }),
      this.prisma.userNotification.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          record: {
            select: {
              medication: true,
              renewalDate: true,
            },
          },
        },
      }),
    ]);

    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;

    const data = rows.map((n) => {
      const renewalDate = n.record?.renewalDate ?? n.dueDate ?? null;
      const daysRemaining =
        renewalDate == null
          ? null
          : Math.ceil((renewalDate.getTime() - now) / msPerDay);
      const fullName = [n.user?.firstName, n.user?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();

      return {
        id: n.id,
        title: n.title,
        message: n.message,
        status: n.status as NotificationStatus,
        read: n.read,
        dueDate: n.dueDate ? n.dueDate.toISOString() : null,
        createdAt: n.createdAt.toISOString(),
        fullName: fullName || undefined,
        email: n.user?.email,
        phone: n.user?.phone ?? null,
        medication: n.record?.medication ?? null,
        renewalDate: renewalDate ? renewalDate.toISOString() : null,
        daysRemaining,
      } satisfies AdminNotificationDto;
    });

    return {
      data,
      meta: buildPaginationMeta({ page, limit }, totalItems),
    };
  }

  async exportNotificationsReport(): Promise<{
    buffer: Buffer;
    filename: string;
    total: number;
  }> {
    const notifications = await this.prisma.userNotification.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        record: {
          select: {
            medication: true,
            renewalDate: true,
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Notifications');
    worksheet.columns = [
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Title', key: 'title', width: 32 },
      { header: 'Medication', key: 'medication', width: 32 },
      { header: 'Renewal Date', key: 'renewalDate', width: 18 },
      { header: 'Days Remaining', key: 'daysRemaining', width: 18 },
    ];

    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;

    for (const notification of notifications) {
      const fullName = [notification.user.firstName, notification.user.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      const renewalDate =
        notification.record?.renewalDate ?? notification.dueDate ?? null;
      const daysRemaining =
        renewalDate !== null
          ? Math.ceil(
              (renewalDate.getTime() - now.getTime()) / msPerDay,
            )
          : null;

      worksheet.addRow({
        fullName,
        email: notification.user.email,
        phone: notification.user.phone ?? '',
        title: notification.title,
        medication: notification.record?.medication ?? 'N/A',
        renewalDate: renewalDate
          ? renewalDate.toISOString().split('T')[0]
          : '',
        daysRemaining: daysRemaining ?? '',
      });
    }

    if (worksheet.rowCount > 0) {
      worksheet.getRow(1).font = { bold: true };
    }

    const filename = `notifications-${now
      .toISOString()
      .split('T')[0]
      .replace(/:/g, '')}.xlsx`;

    const bufferLike = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.isBuffer(bufferLike)
      ? bufferLike
      : Buffer.from(bufferLike);

    return {
      buffer,
      filename,
      total: notifications.length,
    };
  }

  private async computePatientMetrics(): Promise<{
    totalUsers: number;
    newUsers: number;
    activePatientsLast30Days: number;
    activePatients: number;
    orders: number;
    conversion: number;
    closedReminders: number;
    totalReminders: number;
    reminderEfficacy: number;
    totalRevenue: number;
  }> {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers,
      activePatientsLast30Days,
      activePatients,
      orders,
      convertedPatients,
      closedReminders,
      totalReminders,
      revenueAggregate,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { role: Role.PATIENT } }),
      this.prisma.user.count({
        where: { role: Role.PATIENT, createdAt: { gte: last7Days } },
      }),
      this.prisma.user.count({
        where: {
          role: Role.PATIENT,
          records: {
            some: buildActiveRecordFilter({
              currentDate: now,
              endDateLowerBound: last30Days,
            }),
          },
        },
      }),
      this.prisma.user.count({
        where: {
          role: Role.PATIENT,
          isActive: true,
        },
      }),
      this.prisma.record.count({
        where: { createdAt: { gte: last30Days } },
      }),
      this.prisma.user.count({
        where: { role: Role.PATIENT, records: { some: {} } },
      }),
      this.prisma.userNotification.count({
        where: { status: NotificationStatus.CLOSED },
      }),
      this.prisma.userNotification.count(),
      this.prisma.record.aggregate({
        _sum: { price: true },
      }),
    ]);

    const conversion =
      totalUsers === 0
        ? 0
        : Number((convertedPatients / totalUsers).toFixed(4));
    const reminderEfficacy =
      totalReminders === 0
        ? 0
        : Number((closedReminders / totalReminders).toFixed(4));
    const totalRevenue = Number(revenueAggregate._sum.price ?? 0);

    return {
      totalUsers,
      newUsers,
      activePatientsLast30Days,
      activePatients,
      orders,
      conversion,
      closedReminders,
      totalReminders,
      reminderEfficacy,
      totalRevenue,
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

  private parseNotificationSort(sort?: string) {
    if (!sort) {
      return [
        { dueDate: 'asc' as const },
        { createdAt: 'desc' as const },
      ];
    }

    const [field, direction] = sort.split(':');
    const dir = direction?.toLowerCase() === 'desc' ? 'desc' : 'asc';

    if (field === 'renewalDate') {
      return [
        { record: { renewalDate: dir as 'asc' | 'desc' } },
        { dueDate: dir as 'asc' | 'desc' },
        { createdAt: 'desc' as const },
      ];
    }

    if (field === 'createdAt') {
      return [{ createdAt: dir as 'asc' | 'desc' }];
    }

    return [
      { dueDate: 'asc' as const },
      { createdAt: 'desc' as const },
    ];
  }
}
