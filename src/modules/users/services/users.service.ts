import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  User as PrismaUserModel,
  Record as PrismaRecordModel,
} from '@prisma/client';
import {
  PrismaService,
  AuditLogService,
  PasswordService,
  AuditAction,
  Role,
  MedicationType,
} from '../../common';
import {
  PaginatedResult,
  buildPaginationMeta,
} from '../../common/interfaces/paginated-result.interface';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { decimalToNumber, exclude } from '../../common/utils/prisma.utils';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import {
  UserRecordSummaryDto,
  UserResponseDto,
} from '../dto/user-response.dto';
import { PrismaKnownError } from '../../common/services/prisma.service';

type UserWithRelations = PrismaUserModel & {
  records?: PrismaRecordModel[];
};

type Actor = { id: string; role: Role };

@Injectable()
export class UsersService {
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
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);

    const user = await this.prisma.safeExecute(() =>
      this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          role: Role.PATIENT,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          weightLoss: dto.weightLoss ?? null,
          weightDose: dto.weightDose ?? null,
          currentWeight: dto.currentWeight ?? null,
          goalWeight: dto.goalWeight ?? null,
          isEmailVerified: options?.autoVerifyEmail ?? false,
        },
      }),
    ).catch((error) => {
      if (error instanceof PrismaKnownError && error.code === 'P2002') {
        const target = Array.isArray(error.meta?.target)
          ? (error.meta?.target as string[])
          : [];
        if (target.includes('phone')) {
          throw new BadRequestException(
            'This phone number is already linked to another account.',
          );
        }
        throw new BadRequestException(
          'An account with these details already exists.',
        );
      }
      throw error;
    });

    await this.auditLogService.log(AuditAction.USER_CREATED, {
      actorUserId: requestContext.userId ?? null,
      targetUserId: user.id,
      entityType: 'User',
      entityId: user.id,
      metadata: {
        role: user.role,
        email: user.email,
      },
      ip: requestContext.ip ?? null,
      userAgent: requestContext.userAgent ?? null,
    });

    return this.toResponseDto(user);
  }

  async createUserAsAdmin(
    dto: CreateUserDto,
    requestContext: RequestContext,
  ): Promise<UserResponseDto> {
    const role = dto.role ?? Role.PATIENT;

    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);

    const user = await this.prisma.safeExecute(() =>
      this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          role,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          weightLoss: dto.weightLoss ?? null,
          weightDose: dto.weightDose ?? null,
          currentWeight: dto.currentWeight ?? null,
          goalWeight: dto.goalWeight ?? null,
          isActive:
            dto.isActive === undefined ? true : Boolean(dto.isActive),
          isEmailVerified: role === Role.ADMIN,
        },
      }),
    ).catch((error) => {
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
    });

    await this.auditLogService.log(AuditAction.USER_CREATED, {
      actorUserId: requestContext.userId ?? null,
      targetUserId: user.id,
      entityType: 'User',
      entityId: user.id,
      metadata: {
        role: user.role,
        createdBy: 'admin',
      },
      ip: requestContext.ip ?? null,
      userAgent: requestContext.userAgent ?? null,
    });

    return this.toResponseDto(user);
  }

  async listUsers(
    query: ListUsersQueryDto,
  ): Promise<PaginatedResult<UserResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.role) {
      where['role'] = query.role;
    }
    if (query.isActive !== undefined) {
      where['isActive'] = query.isActive;
    }
    if (query.email) {
      where['email'] = {
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
      }),
    ]);

    return {
      data: users.map((user) => this.toResponseDto(user)),
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
    const user = await this.findByIdOrThrow(id);

    if (actor.role !== Role.ADMIN && actor.id !== user.id) {
      throw new ForbiddenException('You are not allowed to update this user');
    }

    if (dto.phone && dto.phone !== user.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: {
          phone: dto.phone,
          id: { not: user.id },
        },
      });
      if (existingPhone) {
        throw new BadRequestException('Phone number already in use');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName ?? user.firstName,
        lastName: dto.lastName ?? user.lastName,
        phone: dto.phone ?? user.phone,
        weightLoss: dto.weightLoss ?? user.weightLoss,
        weightDose: dto.weightDose ?? user.weightDose,
        currentWeight: dto.currentWeight ?? user.currentWeight,
        goalWeight: dto.goalWeight ?? user.goalWeight,
      },
    });

    await this.auditLogService.log(AuditAction.USER_UPDATED, {
      actorUserId: actor.id,
      targetUserId: updated.id,
      entityType: 'User',
      entityId: updated.id,
      metadata: {
        fields: Object.keys(dto),
      },
      ip: requestContext.ip ?? null,
      userAgent: requestContext.userAgent ?? null,
    });

    return this.toResponseDto(updated);
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

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        role: dto.role,
      },
    });

    await this.auditLogService.log(AuditAction.USER_ROLE_CHANGED, {
      actorUserId: actor.id,
      targetUserId: updated.id,
      entityType: 'User',
      entityId: updated.id,
      metadata: { role: dto.role },
      ip: requestContext.ip ?? null,
      userAgent: requestContext.userAgent ?? null,
    });

    return this.toResponseDto(updated);
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

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: dto.isActive,
      },
    });

    await this.auditLogService.log(
      dto.isActive ? AuditAction.USER_ACTIVATED : AuditAction.USER_DEACTIVATED,
      {
        actorUserId: actor.id,
        targetUserId: updated.id,
        entityType: 'User',
        entityId: updated.id,
        metadata: { isActive: dto.isActive },
        ip: requestContext.ip ?? null,
        userAgent: requestContext.userAgent ?? null,
      },
    );

    return this.toResponseDto(updated);
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
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        records: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponseDto(user as UserWithRelations);
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

  toResponseDto(user: UserWithRelations): UserResponseDto {
    const sanitized = exclude(user, ['passwordHash']);

    const records: UserRecordSummaryDto[] | undefined = user.records
      ? user.records.map((record) => ({
          id: record.id,
          startDate: record.startDate.toISOString(),
          endDate: record.endDate ? record.endDate.toISOString() : null,
          medicationName: record.medicationName,
          medicationType: record.medicationType as unknown as MedicationType,
          notes: record.notes,
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString(),
        }))
      : undefined;

    return {
      id: sanitized.id,
      role: sanitized.role as unknown as Role,
      firstName: sanitized.firstName,
      lastName: sanitized.lastName,
      email: sanitized.email,
      phone: sanitized.phone ?? null,
      weightLoss: decimalToNumber(sanitized.weightLoss),
      weightDose: decimalToNumber(sanitized.weightDose),
      currentWeight: decimalToNumber(sanitized.currentWeight),
      goalWeight: decimalToNumber(sanitized.goalWeight),
      isEmailVerified: sanitized.isEmailVerified,
      isActive: sanitized.isActive,
      createdAt: sanitized.createdAt.toISOString(),
      updatedAt: sanitized.updatedAt.toISOString(),
      records,
    };
  }
}
