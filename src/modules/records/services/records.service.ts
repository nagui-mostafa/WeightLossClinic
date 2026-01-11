import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditLogService,
  PrismaService,
  buildPaginationMeta,
  AuditAction,
  Role,
} from '../../common';
import { UsersService } from '../../users/services/users.service';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { ListRecordsQueryDto } from '../dto/list-records-query.dto';
import { RecordResponseDto } from '../dto/record-response.dto';
import { CreateRecordDto } from '../dto/create-record.dto';
import { UpdateRecordDto } from '../dto/update-record.dto';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import {
  RecordTrackingBatchRequestDto,
  RecordTrackingBatchResponseDto,
  RecordTrackingDetailsDto,
} from '../dto/record-tracking.dto';
import {
  FedexTrackingPayload,
  FedexTrackingService,
} from './fedex-tracking.service';
import { GrouponService } from '../../groupon/groupon.service';

type Actor = { id: string; role: Role };
type RecordEntity = Record<string, any>;

@Injectable()
export class RecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly usersService: UsersService,
    private readonly fedexTrackingService: FedexTrackingService,
    private readonly grouponService: GrouponService,
  ) {}

  async listRecords(
    actor: Actor,
    query: ListRecordsQueryDto,
  ): Promise<PaginatedResult<RecordResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (actor.role === Role.PATIENT) {
      where['userId'] = actor.id;
    } else if (query.userId) {
      where['userId'] = query.userId;
    }

    if (query.medicationType) {
      where['medicationType'] = query.medicationType;
    }

    if (query.startDate || query.endDate) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (query.startDate) {
        dateFilter.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        dateFilter.lte = new Date(query.endDate);
      }
      where['startDate'] = dateFilter;
    }

    const orderBy = this.parseSort(query.sort);

    const [totalItems, records] = (await this.prisma.$transaction([
      this.prisma.record.count({ where }),
      this.prisma.record.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
    ])) as [number, RecordEntity[]];

    return {
      data: records.map((record) => this.toResponseDto(record)),
      meta: buildPaginationMeta(query, totalItems),
    };
  }

  async createRecord(
    actor: Actor,
    dto: CreateRecordDto,
    context: RequestContext,
  ): Promise<RecordResponseDto> {
    const userId =
      actor.role === Role.ADMIN ? (dto.userId ?? actor.id) : actor.id;

    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    // Validate voucher reservation early (if provided)
    const voucherReservationId = dto.voucherReservationId;
    if (voucherReservationId) {
      await this.ensureVoucherReservationIsUsable(voucherReservationId);
    }

    this.validateDateRange(dto.startDate, dto.endDate);

    const record = (await this.prisma.record.create({
      data: {
        userId,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        medication: dto.medication,
        medicationType: dto.medicationType ?? null,
        category: dto.category ?? null,
        status: 'ACTIVE',
        purchasedAt: new Date(dto.purchasedAt),
        renewalDate: dto.renewalDate ? new Date(dto.renewalDate) : null,
        notes: dto.notes ?? null,
        trackingNumber: dto.trackingNumber ?? null,
        price: dto.price ?? null,
        planDuration: dto.planDuration ?? null,
      },
    })) as RecordEntity;

    // Close prior notifications for the same category (user can have only one active per category)
    await this.usersService.closeNotificationsForPriorCategoryRecords(
      userId,
      dto.category ?? null,
      record.id,
    );

    // Mark prior records in same category as COMPLETED
    if (dto.category) {
      await this.prisma.record.updateMany({
        where: {
          userId,
          category: dto.category,
          id: { not: record.id },
        },
        data: { status: 'COMPLETED' },
      });
    }

    if (voucherReservationId) {
      await this.linkVoucherToRecord(voucherReservationId, record.id);
    }

    await this.auditLogService.log(AuditAction.RECORD_CREATED, {
      actorUserId: actor.id,
      targetUserId: userId,
      entityType: 'Record',
      entityId: record.id,
      metadata: { medication: record.medication },
      ip: context.ip ?? null,
      userAgent: context.userAgent ?? null,
    });

    await this.usersService.syncUserActiveStatus(userId);
    await this.usersService.syncRenewalNotifications(userId);

    return this.toResponseDto(record);
  }

  async getRecord(actor: Actor, id: string): Promise<RecordResponseDto> {
    const record = (await this.prisma.record.findUnique({
      where: { id },
    })) as RecordEntity | null;

    if (!record) {
      throw new NotFoundException('Record not found');
    }

    this.ensureOwnership(actor, record);

    return this.toResponseDto(record);
  }

  async updateRecord(
    actor: Actor,
    id: string,
    dto: UpdateRecordDto,
    context: RequestContext,
  ): Promise<RecordResponseDto> {
    const record = (await this.prisma.record.findUnique({
      where: { id },
    })) as RecordEntity | null;
    if (!record) {
      throw new NotFoundException('Record not found');
    }

    this.ensureOwnership(actor, record);
    this.validateDateRange(
      dto.startDate ?? record.startDate.toISOString(),
      dto.endDate,
    );

    const updated = (await this.prisma.record.update({
      where: { id },
      data: {
        startDate: dto.startDate ? new Date(dto.startDate) : record.startDate,
        endDate:
          dto.endDate !== undefined
            ? dto.endDate
              ? new Date(dto.endDate)
              : null
            : record.endDate,
        medication: dto.medication ?? record.medication,
        medicationType: dto.medicationType ?? record.medicationType,
        category: dto.category ?? record.category,
        status: dto.status ?? record.status,
        purchasedAt:
          dto.purchasedAt !== undefined
            ? new Date(dto.purchasedAt)
            : record.purchasedAt,
        renewalDate:
          dto.renewalDate !== undefined
            ? dto.renewalDate
              ? new Date(dto.renewalDate)
              : null
            : record.renewalDate,
        notes: dto.notes ?? record.notes,
        trackingNumber:
          dto.trackingNumber !== undefined
            ? (dto.trackingNumber ?? null)
            : record.trackingNumber,
        price:
          dto.price !== undefined ? (dto.price ?? null) : record.price,
        planDuration:
          dto.planDuration !== undefined
            ? dto.planDuration ?? null
            : record.planDuration,
      },
    })) as RecordEntity;

    await this.auditLogService.log(AuditAction.RECORD_UPDATED, {
      actorUserId: actor.id,
      targetUserId: updated.userId,
      entityType: 'Record',
      entityId: updated.id,
      metadata: { fields: Object.keys(dto) },
      ip: context.ip ?? null,
      userAgent: context.userAgent ?? null,
    });

    await this.usersService.syncUserActiveStatus(updated.userId);
    await this.usersService.syncRenewalNotifications(updated.userId);

    return this.toResponseDto(updated);
  }

  async deleteRecord(
    actor: Actor,
    id: string,
    context: RequestContext,
  ): Promise<void> {
    const record = (await this.prisma.record.findUnique({
      where: { id },
    })) as RecordEntity | null;
    if (!record) {
      throw new NotFoundException('Record not found');
    }

    this.ensureOwnership(actor, record);

    await this.prisma.record.delete({ where: { id } });

    await this.auditLogService.log(AuditAction.RECORD_DELETED, {
      actorUserId: actor.id,
      targetUserId: record.userId,
      entityType: 'Record',
      entityId: record.id,
      metadata: { medication: record.medication },
      ip: context.ip ?? null,
      userAgent: context.userAgent ?? null,
    });

    await this.usersService.syncUserActiveStatus(record.userId);
    await this.usersService.syncRenewalNotifications(record.userId);
  }

  async getRecordTracking(
    actor: Actor,
    id: string,
  ): Promise<RecordTrackingDetailsDto> {
    const record = await this.prisma.record.findUnique({
      where: { id },
      select: { id: true, userId: true, trackingNumber: true },
    });

    if (!record) {
      throw new NotFoundException('Record not found');
    }

    this.ensureOwnership(actor, record as RecordEntity);

    if (!record.trackingNumber) {
      throw new BadRequestException(
        'This record does not have a tracking number yet.',
      );
    }

    const trackingPayload = await this.fedexTrackingService.fetchTracking(
      record.trackingNumber,
    );

    return this.composeTrackingDetails(
      record.id,
      record.trackingNumber,
      trackingPayload,
    );
  }

  async getRecordsTracking(
    actor: Actor,
    dto: RecordTrackingBatchRequestDto,
  ): Promise<RecordTrackingBatchResponseDto> {
    const uniqueIds = Array.from(new Set(dto.ids));
    if (uniqueIds.length === 0) {
      throw new BadRequestException('At least one record id is required');
    }

    const records = await this.prisma.record.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, userId: true, trackingNumber: true },
    });

    if (actor.role === Role.PATIENT) {
      const unauthorized = records.some((record) => record.userId !== actor.id);
      if (unauthorized) {
        throw new ForbiddenException('Access denied');
      }
    }

    const recordMap = new Map(records.map((record) => [record.id, record]));

    const items = await Promise.all(
      uniqueIds.map(async (recordId) => {
        const record = recordMap.get(recordId);
        if (!record) {
          return {
            recordId,
            trackingNumber: null,
            carrier: 'Unavailable',
            currentStatus: 'Unavailable',
            deliveryLocation: null,
            deliveredAt: null,
            estimatedDelivery: null,
            packageWeight: null,
            eventTimeline: [],
            error: 'Record not found',
          } as RecordTrackingDetailsDto;
        }

        if (!record.trackingNumber) {
          return {
            recordId,
            trackingNumber: null,
            carrier: 'Unavailable',
            currentStatus: 'Unavailable',
            deliveryLocation: null,
            deliveredAt: null,
            estimatedDelivery: null,
            packageWeight: null,
            eventTimeline: [],
            error: 'Tracking number not set',
          } as RecordTrackingDetailsDto;
        }

        try {
          const trackingPayload = await this.fedexTrackingService.fetchTracking(
            record.trackingNumber,
          );
          return this.composeTrackingDetails(
            record.id,
            record.trackingNumber,
            trackingPayload,
          );
        } catch (error) {
          return {
            recordId: record.id,
            trackingNumber: record.trackingNumber,
            carrier: 'Unavailable',
            currentStatus: 'Unavailable',
            deliveryLocation: null,
            deliveredAt: null,
            estimatedDelivery: null,
            packageWeight: null,
            eventTimeline: [],
            error: (error as Error).message,
          } as RecordTrackingDetailsDto;
        }
      }),
    );

    return { items };
  }

  private composeTrackingDetails(
    recordId: string,
    trackingNumber: string,
    payload: FedexTrackingPayload,
  ): RecordTrackingDetailsDto {
    return {
      recordId,
      trackingNumber,
      carrier: payload.carrier,
      currentStatus: payload.currentStatus,
      deliveryLocation: payload.deliveryLocation ?? null,
      deliveredAt: payload.deliveredAt ?? null,
      estimatedDelivery: payload.estimatedDelivery ?? null,
      packageWeight: payload.packageWeight ?? null,
      eventTimeline: payload.eventTimeline ?? [],
    };
  }

  private toResponseDto(record: RecordEntity): RecordResponseDto {
    return {
      id: record.id,
      userId: record.userId,
      startDate: record.startDate.toISOString(),
      endDate: record.endDate ? record.endDate.toISOString() : null,
      medication: record.medication,
      medicationType: record.medicationType,
      category: record.category,
      purchasedAt: record.purchasedAt.toISOString(),
      renewalDate: record.renewalDate ? record.renewalDate.toISOString() : null,
      notes: record.notes,
      trackingNumber: record.trackingNumber ?? null,
      price: record.price ? Number(record.price) : null,
      planDuration: record.planDuration ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private ensureOwnership(actor: Actor, record: RecordEntity): void {
    if (actor.role === Role.ADMIN) {
      return;
    }

    if (record.userId !== actor.id) {
      throw new ForbiddenException('Access denied');
    }
  }

  private validateDateRange(startDate: string, endDate?: string): void {
    if (endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        throw new BadRequestException('endDate must be greater than startDate');
      }
    }
  }

  private parseSort(sort?: string) {
    if (!sort) {
      return { startDate: 'desc' } as const;
    }

    const [field, direction] = sort.split(':');
    const allowed = new Set(['startDate', 'createdAt', 'updatedAt']);
    if (!field || !allowed.has(field)) {
      return { startDate: 'desc' } as const;
    }

    const dir = direction?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    return { [field]: dir } as Record<string, 'asc' | 'desc'>;
  }

  private async ensureVoucherReservationIsUsable(reservationId: string) {
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(reservationId)) {
      throw new BadRequestException('Invalid voucherReservationId format');
    }

    const voucher = await this.prisma.grouponVoucher.findUnique({
      where: { id: reservationId },
    });

    if (!voucher) {
      throw new BadRequestException('Voucher reservation not found');
    }

    const now = new Date();
    if (
      voucher.reservationExpiresAt &&
      voucher.reservationExpiresAt.getTime() < now.getTime()
    ) {
      await this.prisma.grouponVoucher.update({
        where: { id: voucher.id },
        data: { status: 'RELEASED', reservationExpiresAt: null },
      });
      throw new BadRequestException(
        'Voucher reservation expired. Please re-validate.',
      );
    }

    if (voucher.status !== 'RESERVED') {
      throw new BadRequestException('Voucher is not in a reservable state');
    }

    if (voucher.recordId) {
      throw new BadRequestException('Voucher is already linked to a record');
    }
  }

  private async linkVoucherToRecord(reservationId: string, recordId: string) {
    await this.prisma.grouponVoucher.update({
      where: { id: reservationId },
      data: { recordId },
    });
  }
}
