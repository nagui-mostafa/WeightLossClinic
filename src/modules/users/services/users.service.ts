import { randomUUID } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  Prisma,
  User as PrismaUserModel,
  UserShipping as PrismaUserShipping,
  UserSnapshot as PrismaUserSnapshot,
  UserActivity as PrismaUserActivity,
  UserShot as PrismaUserShot,
  Record as PrismaRecordModel,
} from '@prisma/client';
import {
  PrismaService,
  AuditLogService,
  PasswordService,
  AuditAction,
  Role,
  ActivityKind,
  MedicationType,
} from '../../common';
import {
  PaginatedResult,
  buildPaginationMeta,
} from '../../common/interfaces/paginated-result.interface';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { decimalToNumber, exclude } from '../../common/utils/prisma.utils';
import { formatRelativeTime } from '../../common/utils/time.utils';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { PrismaKnownError } from '../../common/services/prisma.service';

type UserGraph = PrismaUserModel & {
  shipping: PrismaUserShipping | null;
  snapshot: PrismaUserSnapshot | null;
  activities: PrismaUserActivity[];
  records: PrismaRecordModel[];
  shots: PrismaUserShot[];
};

type Actor = { id: string; role: Role };

@Injectable()
export class UsersService {
  private readonly userInclude = {
    shipping: true,
    snapshot: true,
    activities: { orderBy: { occurredAt: 'desc' } },
    records: { orderBy: { startDate: 'desc' } },
    shots: { orderBy: { date: 'desc' } },
  } as const;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly passwordService: PasswordService,
  ) {}

  async findByEmail(email: string): Promise<PrismaUserModel | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string): Promise<PrismaUserModel | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByIdOrThrow(id: string): Promise<PrismaUserModel> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async createPatient(
    dto: CreateUserDto,
    requestContext: RequestContext,
    options?: { autoVerifyEmail?: boolean },
  ): Promise<UserResponseDto> {
    await this.ensurePhoneUnique(dto.phone ?? null);

    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);

    const created = await this.prisma
      .safeExecute(() =>
        this.prisma.user.create({
          data: {
            email: dto.email.toLowerCase(),
            passwordHash,
            role: Role.PATIENT,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            avatarUrl: dto.avatarUrl ?? null,
            isActive: dto.isActive === undefined ? true : Boolean(dto.isActive),
            isEmailVerified: options?.autoVerifyEmail ?? false,
          },
        }),
      )
      .catch((error) => this.handleUniqueConstraintError(error));

    await this.auditLogService.log(AuditAction.USER_CREATED, {
      actorUserId: requestContext.userId ?? null,
      targetUserId: created.id,
      entityType: 'User',
      entityId: created.id,
      metadata: {
        role: created.role,
        email: created.email,
      },
      ip: requestContext.ip ?? null,
      userAgent: requestContext.userAgent ?? null,
    });

    const fullUser = await this.getFullUserOrThrow(created.id);
    return this.toResponseDto(fullUser);
  }

  async createUserAsAdmin(
    dto: CreateUserDto,
    requestContext: RequestContext,
  ): Promise<UserResponseDto> {
    const role = dto.role ?? Role.PATIENT;

    await this.ensurePhoneUnique(dto.phone ?? null);

    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);

    const created = await this.prisma
      .safeExecute(() =>
        this.prisma.user.create({
          data: {
            email: dto.email.toLowerCase(),
            passwordHash,
            role,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            avatarUrl: dto.avatarUrl ?? null,
            isActive: dto.isActive === undefined ? true : Boolean(dto.isActive),
            isEmailVerified: role === Role.ADMIN,
          },
        }),
      )
      .catch((error) => this.handleUniqueConstraintError(error));

    await this.auditLogService.log(AuditAction.USER_CREATED, {
      actorUserId: requestContext.userId ?? null,
      targetUserId: created.id,
      entityType: 'User',
      entityId: created.id,
      metadata: {
        role: created.role,
        createdBy: 'admin',
      },
      ip: requestContext.ip ?? null,
      userAgent: requestContext.userAgent ?? null,
    });

    const fullUser = await this.getFullUserOrThrow(created.id);
    return this.toResponseDto(fullUser);
  }

  async listUsers(
    query: ListUsersQueryDto,
  ): Promise<PaginatedResult<UserResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (query.role) {
      where.role = query.role;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query.email) {
      where.email = {
        contains: query.email.toLowerCase(),
        mode: 'insensitive',
      };
    }

    const orderBy = this.parseSort(query.sort);

    const [totalItems, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: this.userInclude,
      }),
    ]);

    return {
      data: users.map((user) => this.toResponseDto(user as UserGraph)),
      meta: buildPaginationMeta(
        { page, limit } as PaginationQueryDto,
        totalItems,
      ),
    };
  }

  async updateUser(
    id: string,
    dto: UpdateUserDto,
    requestContext: RequestContext,
    actor: Actor,
  ): Promise<UserResponseDto> {
    const existing = await this.getFullUserOrThrow(id);

    if (actor.role !== Role.ADMIN && actor.id !== existing.id) {
      throw new ForbiddenException('You are not allowed to update this user');
    }

    if (dto.profile?.phone && dto.profile.phone !== existing.phone) {
      await this.ensurePhoneUnique(dto.profile.phone, existing.id);
    }

    await this.prisma.$transaction(async (tx) => {
      // Profile updates
      if (dto.profile) {
        const profileUpdate: Prisma.UserUpdateInput = {};

        if (dto.profile.firstName !== undefined) {
          profileUpdate.firstName = dto.profile.firstName;
        }
        if (dto.profile.lastName !== undefined) {
          profileUpdate.lastName = dto.profile.lastName;
        }
        if (dto.profile.phone !== undefined) {
          profileUpdate.phone = dto.profile.phone;
        }
        if (dto.profile.avatarUrl !== undefined) {
          profileUpdate.avatarUrl = dto.profile.avatarUrl ?? null;
        }

        if (Object.keys(profileUpdate).length > 0) {
          await tx.user.update({
            where: { id },
            data: profileUpdate,
          });
        }
      }

      // Shipping
      if (dto.shipping !== undefined) {
        if (dto.shipping === null) {
          await tx.userShipping.deleteMany({ where: { userId: id } });
        } else {
          const base = existing.shipping;
          const payload = {
            fullName: dto.shipping.fullName ?? base?.fullName,
            address1: dto.shipping.address1 ?? base?.address1,
            address2:
              dto.shipping.address2 !== undefined
                ? dto.shipping.address2
                : (base?.address2 ?? null),
            city: dto.shipping.city ?? base?.city,
            state: dto.shipping.state ?? base?.state,
            postalCode: dto.shipping.postalCode ?? base?.postalCode,
            country: dto.shipping.country ?? base?.country,
            phone:
              dto.shipping.phone !== undefined
                ? dto.shipping.phone
                : (base?.phone ?? null),
          };

          const requiredFields = [
            'fullName',
            'address1',
            'city',
            'state',
            'postalCode',
            'country',
          ] as const;
          const missing = requiredFields.filter((field) => !payload[field]);
          if (!base && missing.length > 0) {
            throw new BadRequestException(
              `Missing required shipping fields: ${missing.join(', ')}`,
            );
          }

          const shippingData = {
            fullName: payload.fullName as string,
            address1: payload.address1 as string,
            address2: payload.address2 ?? null,
            city: payload.city as string,
            state: payload.state as string,
            postalCode: payload.postalCode as string,
            country: payload.country as string,
            phone: payload.phone ?? null,
          };

          if (base) {
            await tx.userShipping.update({
              where: { userId: id },
              data: shippingData,
            });
          } else {
            await tx.userShipping.create({
              data: {
                userId: id,
                ...shippingData,
              },
            });
          }
        }
      }

      // Snapshot
      if (dto.snapshot !== undefined) {
        if (dto.snapshot === null) {
          await tx.userSnapshot.deleteMany({ where: { userId: id } });
        } else {
          const base = existing.snapshot;
          const snapshotPayload = {
            currentWeightLbs:
              dto.snapshot.currentWeightLbs ??
              decimalToNumber(base?.currentWeightLbs),
            goalWeightLbs:
              dto.snapshot.goalWeightLbs ??
              decimalToNumber(base?.goalWeightLbs),
            medicationType:
              dto.snapshot.medicationType ?? base?.medicationType ?? null,
            doseName:
              dto.snapshot.dose?.name ??
              (dto.snapshot.dose === null ? null : (base?.doseName ?? null)),
            doseValue:
              dto.snapshot.dose?.value ??
              (dto.snapshot.dose === null
                ? null
                : decimalToNumber(base?.doseValue)),
            doseUnit:
              dto.snapshot.dose?.unit ??
              (dto.snapshot.dose === null ? null : (base?.doseUnit ?? null)),
            nextAppointmentId:
              dto.snapshot.nextAppointment?.id ??
              (dto.snapshot.nextAppointment === null
                ? null
                : (base?.nextAppointmentId ?? null)),
            nextAppointmentStartsAt: dto.snapshot.nextAppointment?.startsAt
              ? new Date(dto.snapshot.nextAppointment.startsAt)
              : dto.snapshot.nextAppointment === null
                ? null
                : (base?.nextAppointmentStartsAt ?? null),
          };

          if (base) {
            await tx.userSnapshot.update({
              where: { userId: id },
              data: snapshotPayload,
            });
          } else {
            await tx.userSnapshot.create({
              data: {
                userId: id,
                ...snapshotPayload,
              },
            });
          }
        }
      }

      // Activity
      if (dto.activity) {
        await tx.userActivity.deleteMany({ where: { userId: id } });
        if (dto.activity.length > 0) {
          await tx.userActivity.createMany({
            data: dto.activity.map((activity) => ({
              id: activity.id ?? randomUUID(),
              userId: id,
              kind: activity.kind,
              title: activity.title,
              subtitle: activity.subtitle ?? null,
              occurredAt: new Date(activity.occurredAt),
            })),
          });
        }
      }

      // Records
      if (dto.records) {
        await tx.record.deleteMany({ where: { userId: id } });
        if (dto.records.length > 0) {
          await tx.record.createMany({
            data: dto.records.map((record) => ({
              id: record.id ?? randomUUID(),
              userId: id,
              medication: record.medication,
              medicationType: record.medicationType ?? null,
              startDate: new Date(record.startDate),
              endDate: record.endDate ? new Date(record.endDate) : null,
              purchasedAt: new Date(record.purchasedAt),
              renewalDate: record.renewalDate
                ? new Date(record.renewalDate)
                : null,
              notes: record.notes ?? null,
            })),
          });
        }
      }

      // Shots
      if (dto.shots) {
        await tx.userShot.deleteMany({ where: { userId: id } });
        if (dto.shots.length > 0) {
          await tx.userShot.createMany({
            data: dto.shots.map((shot) => ({
              id: shot.id ?? randomUUID(),
              userId: id,
              date: new Date(shot.dateISO),
              medication: shot.medication,
              doseValue: shot.doseValue ?? null,
              doseUnit: shot.doseUnit ?? null,
              site: shot.site ?? null,
              painLevel: shot.painLevel ?? null,
              weightKg: shot.weightKg ?? null,
              caloriesAvg: shot.caloriesAvg ?? null,
              proteinAvgG: shot.proteinAvgG ?? null,
              notes: shot.notes ?? null,
            })),
          });
        }
      }
    });

    await this.auditLogService.log(AuditAction.USER_UPDATED, {
      actorUserId: actor.id,
      targetUserId: id,
      entityType: 'User',
      entityId: id,
      metadata: {
        sections: Object.keys(dto),
      },
      ip: requestContext.ip ?? null,
      userAgent: requestContext.userAgent ?? null,
    });

    const refreshed = await this.getFullUserOrThrow(id);
    return this.toResponseDto(refreshed);
  }

  async updateRole(
    id: string,
    dto: UpdateUserRoleDto,
    actor: Actor,
    requestContext: RequestContext,
  ): Promise<UserResponseDto> {
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can change roles');
    }

    if (actor.id === id && dto.role !== Role.ADMIN) {
      throw new BadRequestException('Admins cannot demote themselves');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        role: dto.role,
      },
    });

    await this.auditLogService.log(AuditAction.USER_ROLE_CHANGED, {
      actorUserId: actor.id,
      targetUserId: id,
      entityType: 'User',
      entityId: id,
      metadata: { role: dto.role },
      ip: requestContext.ip ?? null,
      userAgent: requestContext.userAgent ?? null,
    });

    const refreshed = await this.getFullUserOrThrow(id);
    return this.toResponseDto(refreshed);
  }

  async updateStatus(
    id: string,
    dto: UpdateUserStatusDto,
    actor: Actor,
    requestContext: RequestContext,
  ): Promise<UserResponseDto> {
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can update status');
    }

    if (actor.id === id && dto.isActive === false) {
      throw new BadRequestException('Admins cannot deactivate themselves');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: dto.isActive,
      },
    });

    await this.auditLogService.log(
      dto.isActive ? AuditAction.USER_ACTIVATED : AuditAction.USER_DEACTIVATED,
      {
        actorUserId: actor.id,
        targetUserId: id,
        entityType: 'User',
        entityId: id,
        metadata: { isActive: dto.isActive },
        ip: requestContext.ip ?? null,
        userAgent: requestContext.userAgent ?? null,
      },
    );

    const refreshed = await this.getFullUserOrThrow(id);
    return this.toResponseDto(refreshed);
  }

  async softDelete(
    id: string,
    actor: Actor,
    requestContext: RequestContext,
  ): Promise<void> {
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can delete users');
    }

    if (actor.id === id) {
      throw new BadRequestException('Admins cannot delete themselves');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    await this.auditLogService.log(AuditAction.USER_DEACTIVATED, {
      actorUserId: actor.id,
      targetUserId: id,
      entityType: 'User',
      entityId: id,
      metadata: { reason: 'soft-delete' },
      ip: requestContext.ip ?? null,
      userAgent: requestContext.userAgent ?? null,
    });
  }

  async getUserWithRecords(id: string): Promise<UserResponseDto> {
    const user = await this.getFullUserOrThrow(id);
    return this.toResponseDto(user);
  }

  private parseSort(sort?: string) {
    if (!sort) {
      return { createdAt: 'desc' } as const;
    }

    const [field, direction] = sort.split(':');
    const dir = direction?.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const allowedFields = new Set([
      'createdAt',
      'updatedAt',
      'email',
      'firstName',
    ]);

    if (!allowedFields.has(field)) {
      return { createdAt: 'desc' } as const;
    }

    return { [field]: dir } as Record<string, 'asc' | 'desc'>;
  }

  private async ensurePhoneUnique(
    phone: string | null,
    excludeUserId?: string,
  ): Promise<void> {
    if (!phone) {
      return;
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        phone,
        id: excludeUserId ? { not: excludeUserId } : undefined,
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('This phone number is already in use.');
    }
  }

  private handleUniqueConstraintError(error: unknown): never {
    if (error instanceof PrismaKnownError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target)
        ? (error.meta?.target as string[])
        : [];

      if (target.includes('phone')) {
        throw new BadRequestException(
          'This phone number is already linked to another account.',
        );
      }
      if (target.includes('email')) {
        throw new BadRequestException('Email already in use');
      }

      throw new BadRequestException(
        'An account with these details already exists.',
      );
    }

    throw error;
  }

  private async getFullUserOrThrow(id: string): Promise<UserGraph> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: this.userInclude,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user as UserGraph;
  }

  private toResponseDto(user: UserGraph): UserResponseDto {
    const sanitized = exclude(user, ['passwordHash']);

    const profile = {
      id: sanitized.id,
      firstName: sanitized.firstName,
      lastName: sanitized.lastName,
      email: sanitized.email,
      phone: sanitized.phone ?? null,
      avatarUrl: sanitized.avatarUrl ?? null,
      role: sanitized.role as Role,
      isEmailVerified: sanitized.isEmailVerified,
      isActive: sanitized.isActive,
      createdAt: sanitized.createdAt.toISOString(),
      updatedAt: sanitized.updatedAt.toISOString(),
    };

    const shipping = sanitized.shipping
      ? {
          id: sanitized.shipping.id,
          fullName: sanitized.shipping.fullName,
          address1: sanitized.shipping.address1,
          address2: sanitized.shipping.address2 ?? null,
          city: sanitized.shipping.city,
          state: sanitized.shipping.state,
          postalCode: sanitized.shipping.postalCode,
          country: sanitized.shipping.country,
          phone: sanitized.shipping.phone ?? null,
        }
      : null;

    const snapshot = sanitized.snapshot
      ? {
          currentWeightLbs: decimalToNumber(
            sanitized.snapshot.currentWeightLbs,
          ),
          goalWeightLbs: decimalToNumber(sanitized.snapshot.goalWeightLbs),
          medicationType: sanitized.snapshot.medicationType ?? null,
          dose:
            sanitized.snapshot.doseName ||
            sanitized.snapshot.doseValue ||
            sanitized.snapshot.doseUnit
              ? {
                  name: sanitized.snapshot.doseName ?? '',
                  value: decimalToNumber(sanitized.snapshot.doseValue) ?? 0,
                  unit: sanitized.snapshot.doseUnit ?? '',
                }
              : null,
          nextAppointment:
            sanitized.snapshot.nextAppointmentId &&
            sanitized.snapshot.nextAppointmentStartsAt
              ? {
                  id: sanitized.snapshot.nextAppointmentId,
                  startsAt:
                    sanitized.snapshot.nextAppointmentStartsAt.toISOString(),
                }
              : null,
        }
      : null;

    const activity = sanitized.activities.map((item) => ({
      id: item.id,
      kind: item.kind as ActivityKind,
      title: item.title,
      subtitle: item.subtitle ?? null,
      occurredAt: item.occurredAt.toISOString(),
      when: formatRelativeTime(item.occurredAt),
    }));

    const records = sanitized.records.map((record) => ({
      id: record.id,
      medication: record.medication,
      medicationType: record.medicationType
        ? (record.medicationType as MedicationType)
        : null,
      startDate: record.startDate.toISOString(),
      endDate: record.endDate ? record.endDate.toISOString() : null,
      purchasedAt: record.purchasedAt.toISOString(),
      renewalDate: record.renewalDate ? record.renewalDate.toISOString() : null,
      notes: record.notes ?? null,
    }));

    const shots = sanitized.shots.map((shot) => ({
      id: shot.id,
      dateISO: shot.date.toISOString(),
      medication: shot.medication,
      doseValue: decimalToNumber(shot.doseValue),
      doseUnit: shot.doseUnit ?? null,
      site: shot.site ?? null,
      painLevel: shot.painLevel ?? null,
      weightKg: decimalToNumber(shot.weightKg),
      caloriesAvg: shot.caloriesAvg ?? null,
      proteinAvgG: shot.proteinAvgG ?? null,
      notes: shot.notes ?? null,
    }));

    return {
      profile,
      shipping,
      snapshot,
      activity,
      records,
      shots,
    };
  }
}
