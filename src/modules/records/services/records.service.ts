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
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { ListRecordsQueryDto } from '../dto/list-records-query.dto';
import { RecordResponseDto } from '../dto/record-response.dto';
import { CreateRecordDto } from '../dto/create-record.dto';
import { UpdateRecordDto } from '../dto/update-record.dto';
import { RequestContext } from '../../common/interfaces/request-context.interface';

type Actor = { id: string; role: Role };
type RecordEntity = Record<string, any>;

@Injectable()
export class RecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
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

    this.validateDateRange(dto.startDate, dto.endDate);

    const record = (await this.prisma.record.create({
      data: {
        userId,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        medication: dto.medication,
        medicationType: dto.medicationType ?? null,
        purchasedAt: new Date(dto.purchasedAt),
        renewalDate: dto.renewalDate ? new Date(dto.renewalDate) : null,
        notes: dto.notes ?? null,
      },
    })) as RecordEntity;

    await this.auditLogService.log(AuditAction.RECORD_CREATED, {
      actorUserId: actor.id,
      targetUserId: userId,
      entityType: 'Record',
      entityId: record.id,
      metadata: { medication: record.medication },
      ip: context.ip ?? null,
      userAgent: context.userAgent ?? null,
    });

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
  }

  private toResponseDto(record: RecordEntity): RecordResponseDto {
    return {
      id: record.id,
      userId: record.userId,
      startDate: record.startDate.toISOString(),
      endDate: record.endDate ? record.endDate.toISOString() : null,
      medication: record.medication,
      medicationType: record.medicationType,
      purchasedAt: record.purchasedAt.toISOString(),
      renewalDate: record.renewalDate
        ? record.renewalDate.toISOString()
        : null,
      notes: record.notes,
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
}
