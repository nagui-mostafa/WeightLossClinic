import { randomBytes, randomUUID } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, User as PrismaUserModel } from '@prisma/client';
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
import { addDays, formatRelativeTime } from '../../common/utils/time.utils';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { CreateAdminUserDto } from '../dto/create-admin-user.dto';
import {
  UpdateUserDto,
  UpdateUserRecordDto,
  UpdateUserSnapshotDto,
} from '../dto/update-user.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { UpdateUserStatusDto } from '../guards/update-user-status.dto';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import { UserResponseDto, UserNotificationDto } from '../dto/user-response.dto';
import { PrismaKnownError } from '../../common/services/prisma.service';
import { MailService } from '../../mail/services/mail.service';
import {
  buildActiveRecordFilter,
  hasActivePlanRecord,
} from '../utils/patient-status.util';
import {
  NotificationStatus,
  ProductCategory,
  RecordStatus,
} from '@prisma/client';

const userInclude = {
  shipping: true,
  snapshot: true,
  activities: { orderBy: { occurredAt: 'desc' } },
  records: { orderBy: { startDate: 'desc' } },
  shots: { orderBy: { date: 'desc' } },
  notifications: {
    include: {
      record: {
        select: {
          id: true,
          medication: true,
          renewalDate: true,
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: [{ read: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    take: 5,
  },
} as const satisfies Prisma.UserInclude;

type UserGraph = Prisma.UserGetPayload<{ include: typeof userInclude }>;

type NotificationEntity = UserGraph['notifications'][number];

type Actor = { id: string; role: Role };
type MinimalUser = Pick<PrismaUserModel, 'id' | 'role' | 'isActive'>;

@Injectable()
export class UsersService {
  private readonly userInclude = userInclude;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  private readonly passwordService: PasswordService,
  private readonly mailService: MailService,
  ) {}

  async getRecentNotifications(
    limit = 5,
  ): Promise<UserNotificationDto[]> {
    const notifications = await this.prisma.userNotification.findMany({
      include: {
        record: {
          select: {
            id: true,
            medication: true,
            renewalDate: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [{ read: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    });

    return notifications.map((n) =>
      this.toNotificationDto(n as unknown as NotificationEntity),
    );
  }

  async closeNotificationsForPriorCategoryRecords(
    userId: string,
    category: ProductCategory | null | undefined,
    excludeRecordId: string,
  ): Promise<void> {
    if (!category) {
      return;
    }

    await this.prisma.userNotification.updateMany({
      where: {
        userId,
        record: {
          category,
          id: { not: excludeRecordId },
        },
        status: { in: [NotificationStatus.ACTIVE, NotificationStatus.PROCESSING] },
      },
      data: { status: NotificationStatus.CLOSED, read: true },
    });
  }

  async normalizeRecordStatusesAndNotifications(
    userId: string,
  ): Promise<void> {
    const records = await this.prisma.record.findMany({
      where: { userId },
      select: {
        id: true,
        category: true,
        startDate: true,
        purchasedAt: true,
      },
    });

    const groups = new Map<string, typeof records>();
    for (const r of records) {
      const key = r.category ?? 'UNCATEGORIZED';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }

    for (const [key, recs] of groups.entries()) {
      if (recs.length === 0) continue;
      recs.sort((a, b) => {
        const aDate = a.startDate?.getTime() ?? a.purchasedAt?.getTime() ?? 0;
        const bDate = b.startDate?.getTime() ?? b.purchasedAt?.getTime() ?? 0;
        return bDate - aDate; // newest first
      });
      const active = recs[0];
      const allIds = recs.map((r) => r.id);
      const category =
        key === 'UNCATEGORIZED' ? (null as ProductCategory | null) : (recs[0].category ?? null);

      // mark all completed
      await this.prisma.record.updateMany({
        where: { id: { in: allIds } },
        data: { status: RecordStatus.COMPLETED },
      });
      // mark newest active
      await this.prisma.record.update({
        where: { id: active.id },
        data: { status: RecordStatus.ACTIVE },
      });

      await this.closeNotificationsForPriorCategoryRecords(
        userId,
        category,
        active.id,
      );
    }
  }

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

  async isUserActive(userOrId: PrismaUserModel | string): Promise<boolean> {
    if (typeof userOrId === 'string') {
      return this.syncUserActiveStatus(userOrId);
    }

    return this.syncUserActiveStatus({
      id: userOrId.id,
      role: userOrId.role,
      isActive: userOrId.isActive,
    });
  }

  async syncUserActiveStatus(
    userOrId: string | MinimalUser,
    now: Date = new Date(),
  ): Promise<boolean> {
    const target =
      typeof userOrId === 'string'
        ? await this.prisma.user.findUnique({
            where: { id: userOrId },
            select: { id: true, role: true, isActive: true },
          })
        : userOrId;

    if (!target) {
      return false;
    }

    const role = target.role as Role;
    const nextIsActive =
      role === Role.PATIENT
        ? Boolean(
            await this.prisma.record.findFirst({
              where: {
                userId: target.id,
                ...buildActiveRecordFilter({ currentDate: now }),
              },
              select: { id: true },
            }),
          )
        : true;

    if (target.isActive !== nextIsActive) {
      await this.prisma.user.update({
        where: { id: target.id },
        data: { isActive: nextIsActive },
      });
    }

    return nextIsActive;
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
    const snapshotData = this.buildSnapshotCreateInput(dto.snapshot);
    const recordData = this.buildRecordCreateInputs(dto.records);

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
            isActive: false,
            isEmailVerified: options?.autoVerifyEmail ?? false,
            snapshot: snapshotData ? { create: snapshotData } : undefined,
            records: recordData.length > 0 ? { create: recordData } : undefined,
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

    if (recordData.length > 0) {
      await this.syncUserActiveStatus(created.id);
      await this.syncRenewalNotifications(created.id);
    }

    const fullUser = await this.getFullUserOrThrow(created.id);
    return this.toResponseDto(fullUser);
  }

  async createUserAsAdmin(
    dto: CreateAdminUserDto,
    requestContext: RequestContext,
  ): Promise<UserResponseDto> {
    const role = dto.role ?? Role.PATIENT;
    const initialIsActive = role === Role.ADMIN;

    await this.ensurePhoneUnique(dto.phone ?? null);

    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const generatedPassword = this.generateTemporaryPassword();
    const passwordHash = await this.passwordService.hashPassword(
      generatedPassword,
    );
    const snapshotData = this.buildSnapshotCreateInput(dto.snapshot);
    const recordData = this.buildRecordCreateInputs(dto.records);

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
            isActive: initialIsActive,
            isEmailVerified: role === Role.ADMIN,
            snapshot: snapshotData ? { create: snapshotData } : undefined,
            records: recordData.length > 0 ? { create: recordData } : undefined,
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

    if (role === Role.PATIENT && recordData.length > 0) {
      await this.syncUserActiveStatus(created.id);
    }

    if (recordData.length > 0) {
      await this.syncRenewalNotifications(created.id);
    }

    await this.mailService.sendAdminCreatedCredentialsEmail(
      created.email,
      created.firstName,
      generatedPassword,
    );

    const fullUser = await this.getFullUserOrThrow(created.id);
    return this.toResponseDto(fullUser);
  }

  private generateTemporaryPassword(): string {
    return randomBytes(12).toString('base64url');
  }

  async listUsers(
    query: ListUsersQueryDto,
  ): Promise<PaginatedResult<UserResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const now = new Date();
    const filters: Prisma.UserWhereInput[] = [];

    if (query.role) {
      filters.push({ role: query.role });
    }

    if (query.email) {
      filters.push({
        email: {
          contains: query.email.toLowerCase(),
          mode: 'insensitive',
        },
      });
    }

    if (query.isActive !== undefined) {
      filters.push(
        this.buildActiveStatusFilter(query.isActive, query.role, now),
      );
    }

    const where: Prisma.UserWhereInput =
      filters.length === 0
        ? {}
        : filters.length === 1
          ? filters[0]
          : { AND: filters };

    const orderBy = this.parseSort(query.sort);

    const [totalItems, userIdRows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: { id: true },
      }),
    ]);

    await Promise.all(
      userIdRows.map((row) => this.syncUserActiveStatus(row.id)),
    );
    await Promise.all(
      userIdRows.map((row) => this.syncRenewalNotifications(row.id)),
    );

    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: this.userInclude,
    });

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
        const resolvedIds = dto.records.map((r) => this.resolveRecordId(r.id));

        // delete records missing from payload
        await tx.record.deleteMany({
          where: { userId: id, id: { notIn: resolvedIds } },
        });

        for (const record of dto.records) {
          const recordId = this.resolveRecordId(record.id);
          const data = {
            medication: record.medication,
            medicationType: record.medicationType ?? null,
            category: record.category ?? null,
            status: (record.status as any) ?? RecordStatus.ACTIVE,
            startDate: new Date(record.startDate),
            endDate: record.endDate ? new Date(record.endDate) : null,
            purchasedAt: new Date(record.purchasedAt),
            renewalDate: record.renewalDate
              ? new Date(record.renewalDate)
              : null,
            notes: record.notes ?? null,
            trackingNumber: record.trackingNumber ?? null,
            price: record.price ?? null,
            planDuration: record.planDuration ?? null,
          };

          const existing = record.id
            ? await tx.record.findUnique({ where: { id: recordId } })
            : null;

          if (existing) {
            await tx.record.update({
              where: { id: recordId },
              data,
            });
          } else {
            await tx.record.create({
              data: {
                id: recordId,
                userId: id,
                ...data,
              },
            });
          }
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

    await this.syncUserActiveStatus(id);
    await this.syncRenewalNotifications(id);
    if (dto.records) {
      await this.normalizeRecordStatusesAndNotifications(id);
    }

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

    await this.syncUserActiveStatus(id);
    await this.syncRenewalNotifications(id);

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

    const target = await this.findByIdOrThrow(id);

    const targetRole = target.role as Role;

    if (targetRole === Role.PATIENT) {
      throw new BadRequestException(
        'Patient status is managed automatically via plan records.',
      );
    }

    if (actor.id === id && dto.isActive === false) {
      throw new BadRequestException('Admins cannot deactivate themselves');
    }

    if (targetRole === Role.ADMIN && dto.isActive === false) {
      throw new BadRequestException('Admin accounts must remain active');
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

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.record.updateMany({
        where: {
          userId: id,
          OR: [{ endDate: null }, { endDate: { gt: now } }],
        },
        data: { endDate: now },
      });

      await tx.user.update({
        where: { id },
        data: {
          isActive: false,
        },
      });
    });

    await this.syncUserActiveStatus(id, now);
    await this.syncRenewalNotifications(id);

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

  async listNotifications(
    userId: string,
    actor: Actor,
  ): Promise<UserNotificationDto[]> {
    this.ensureUserAccess(actor, userId);
    await this.syncRenewalNotifications(userId);

    const notifications = await this.prisma.userNotification.findMany({
      where: {
        userId,
        ...(actor.role === Role.ADMIN
          ? {}
          : { status: { not: NotificationStatus.CLOSED } }),
      },
      include: {
        record: {
          select: { id: true, medication: true, renewalDate: true },
        },
      },
      orderBy: [{ read: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    return notifications.map((notification) =>
      this.toNotificationDto(notification as NotificationEntity),
    );
  }

  async markNotificationRead(
    userId: string,
    notificationId: string,
    actor: Actor,
  ): Promise<UserNotificationDto> {
    this.ensureUserAccess(actor, userId);

    const notification = await this.prisma.userNotification.findUnique({
      where: { id: notificationId },
      include: {
        record: {
          select: { id: true, medication: true, renewalDate: true },
        },
      },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.userNotification.update({
      where: { id: notificationId },
      data: { read: true },
      include: {
        record: {
          select: { id: true, medication: true, renewalDate: true },
        },
      },
    });

    return this.toNotificationDto(updated as NotificationEntity);
  }

  async deleteNotification(
    userId: string,
    notificationId: string,
    actor: Actor,
  ): Promise<void> {
    this.ensureUserAccess(actor, userId);

    const notification = await this.prisma.userNotification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.userNotification.delete({
      where: { id: notificationId },
    });
  }

  async updateNotificationStatus(
    userId: string,
    notificationId: string,
    status: 'ACTIVE' | 'PROCESSING',
    actor: Actor,
  ): Promise<UserNotificationDto> {
    this.ensureUserAccess(actor, userId);

    const notification = await this.prisma.userNotification.findUnique({
      where: { id: notificationId },
      include: {
        record: {
          select: {
            id: true,
            medication: true,
            renewalDate: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.userNotification.update({
      where: { id: notificationId },
      data: { status },
      include: {
        record: {
          select: {
            id: true,
            medication: true,
            renewalDate: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return this.toNotificationDto(updated as unknown as NotificationEntity);
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

  private buildActiveStatusFilter(
    isActive: boolean,
    role: Role | undefined,
    now: Date,
  ): Prisma.UserWhereInput {
    const patientFilter = isActive
      ? { records: { some: buildActiveRecordFilter({ currentDate: now }) } }
      : { records: { none: buildActiveRecordFilter({ currentDate: now }) } };

    if (!role) {
      return {
        OR: [
          { role: Role.ADMIN, isActive },
          {
            role: Role.PATIENT,
            ...patientFilter,
          },
        ],
      };
    }

    if (role === Role.PATIENT) {
      return {
        role: Role.PATIENT,
        ...patientFilter,
      };
    }

    return {
      role,
      isActive,
    };
  }

  async syncRenewalNotifications(userId: string): Promise<void> {
    const now = new Date();
    const threshold = addDays(now, 7);

    const records = await this.prisma.record.findMany({
      where: {
        userId,
        renewalDate: {
          not: null,
        },
      },
      select: {
        id: true,
        medication: true,
        renewalDate: true,
      },
    });

    const dueRecords = records.filter((record) => {
      if (!record.renewalDate) {
        return false;
      }
      const due = record.renewalDate;
      return due >= now && due <= threshold;
    });

    const dueRecordIds = dueRecords.map((record) => record.id);

    if (dueRecordIds.length === 0) {
      await this.prisma.userNotification.deleteMany({ where: { userId } });
      return;
    }

    await this.prisma.userNotification.deleteMany({
      where: {
        userId,
        recordId: { notIn: dueRecordIds },
      },
    });

    await this.prisma.userNotification.deleteMany({
      where: {
        userId,
        recordId: null,
      },
    });

    for (const record of dueRecords) {
      const dueDate = record.renewalDate!;
      const message = this.buildRenewalMessage(record.medication, dueDate);

      await this.prisma.userNotification.upsert({
        where: {
          userId_recordId: {
            userId,
            recordId: record.id,
          },
        },
        update: {
          title: 'Renewal reminder',
          message,
          dueDate,
        },
        create: {
          userId,
          recordId: record.id,
          title: 'Renewal reminder',
          message,
          dueDate,
          read: false,
        },
      });
    }
  }

  private buildSnapshotCreateInput(
    snapshot?: UpdateUserSnapshotDto | null,
  ): Prisma.UserSnapshotCreateWithoutUserInput | null {
    if (!snapshot) {
      return null;
    }

    const payload: Prisma.UserSnapshotCreateWithoutUserInput = {};

    if (snapshot.currentWeightLbs !== undefined) {
      payload.currentWeightLbs = snapshot.currentWeightLbs;
    }
    if (snapshot.goalWeightLbs !== undefined) {
      payload.goalWeightLbs = snapshot.goalWeightLbs;
    }
    if (snapshot.medicationType !== undefined) {
      payload.medicationType = snapshot.medicationType ?? null;
    }

    if (snapshot.dose !== undefined) {
      if (snapshot.dose === null) {
        payload.doseName = null;
        payload.doseValue = null;
        payload.doseUnit = null;
      } else {
        payload.doseName = snapshot.dose.name ?? null;
        payload.doseValue = snapshot.dose.value ?? null;
        payload.doseUnit = snapshot.dose.unit ?? null;
      }
    }

    if (snapshot.nextAppointment !== undefined) {
      if (snapshot.nextAppointment === null) {
        payload.nextAppointmentId = null;
        payload.nextAppointmentStartsAt = null;
      } else {
        payload.nextAppointmentId = snapshot.nextAppointment.id ?? null;
        payload.nextAppointmentStartsAt = snapshot.nextAppointment.startsAt
          ? new Date(snapshot.nextAppointment.startsAt)
          : null;
      }
    }

    return payload;
  }

  private buildRecordCreateInputs(
    records?: UpdateUserRecordDto[],
  ): Prisma.RecordCreateWithoutUserInput[] {
    if (!records?.length) {
      return [];
    }

    return records.map((record) => ({
      id: this.resolveRecordId(record.id),
      medication: record.medication,
      medicationType: record.medicationType ?? null,
      category: record.category ?? null,
      status: (record.status as any) ?? RecordStatus.ACTIVE,
      startDate: new Date(record.startDate),
      endDate: record.endDate ? new Date(record.endDate) : null,
      purchasedAt: new Date(record.purchasedAt),
      renewalDate: record.renewalDate ? new Date(record.renewalDate) : null,
      notes: record.notes ?? null,
      trackingNumber: record.trackingNumber ?? null,
      price: record.price ?? null,
      planDuration: record.planDuration ?? null,
    }));
  }

  private resolveRecordId(requestedId?: string): string {
    if (!requestedId) {
      return randomUUID();
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(requestedId)) {
      throw new BadRequestException('Record id must be a valid UUID');
    }

    return requestedId;
  }

  private buildRenewalMessage(medication: string, dueDate: Date): string {
    const dateStr = dueDate.toISOString().split('T')[0];
    return `Your ${medication} plan renews on ${dateStr}.`;
  }

  private ensureUserAccess(actor: Actor, userId: string): void {
    if (actor.role !== Role.ADMIN && actor.id !== userId) {
      throw new ForbiddenException('Access denied');
    }
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
    await this.syncRenewalNotifications(id);

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: this.userInclude,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user as UserGraph;
  }

  private resolveIsActive(user: UserGraph, now: Date = new Date()): boolean {
    const userRole = user.role as Role;
    if (userRole !== Role.PATIENT) {
      return user.isActive;
    }

    return hasActivePlanRecord(user.records, now);
  }

  private toResponseDto(user: UserGraph): UserResponseDto {
    const sanitized = exclude(user, ['passwordHash']);
    const now = new Date();

    const profile = {
      id: sanitized.id,
      firstName: sanitized.firstName,
      lastName: sanitized.lastName,
      email: sanitized.email,
      phone: sanitized.phone ?? null,
      avatarUrl: sanitized.avatarUrl ?? null,
      role: sanitized.role as Role,
      isEmailVerified: sanitized.isEmailVerified,
      isActive: this.resolveIsActive(user, now),
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
      category: record.category ?? null,
      status: record.status as 'ACTIVE' | 'COMPLETED' | 'CANCELED',
      startDate: record.startDate.toISOString(),
      endDate: record.endDate ? record.endDate.toISOString() : null,
      purchasedAt: record.purchasedAt.toISOString(),
      renewalDate: record.renewalDate ? record.renewalDate.toISOString() : null,
      notes: record.notes ?? null,
      trackingNumber: record.trackingNumber ?? null,
      price: record.price ? Number(record.price) : null,
      planDuration: record.planDuration ?? null,
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

    const notifications = sanitized.notifications
      ? sanitized.notifications
          .filter(
            (notification) =>
              profile.role === Role.ADMIN ||
              notification.status !== NotificationStatus.CLOSED,
          )
          .map((notification) => this.toNotificationDto(notification))
      : [];

    return {
      profile,
      shipping,
      snapshot,
      activity,
      records,
      shots,
      notifications,
    };
  }

  private toNotificationDto(
    notification: NotificationEntity,
  ): UserNotificationDto {
    const fullName = [notification.user?.firstName, notification.user?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      dueDate: notification.dueDate ? notification.dueDate.toISOString() : null,
      read: notification.read,
      status: notification.status as 'ACTIVE' | 'PROCESSING' | 'CLOSED',
      fullName: fullName || undefined,
      email: notification.user?.email,
      phone: notification.user?.phone ?? null,
      record: notification.record
        ? {
            id: notification.record.id,
            medication: notification.record.medication,
            renewalDate: notification.record.renewalDate
              ? notification.record.renewalDate.toISOString()
              : null,
          }
        : null,
    };
  }
}
