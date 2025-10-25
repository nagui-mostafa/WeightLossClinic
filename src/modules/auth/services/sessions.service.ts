import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService, AuditLogService, AuditAction } from '../../common';
import { RequestContext } from '../../common/interfaces/request-context.interface';

type RefreshSessionEntity = Record<string, any>;

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createSession(options: {
    sessionId: string;
    userId: string;
    refreshToken: string;
    expiresAt: Date;
    metadata?: RequestContext;
  }): Promise<RefreshSessionEntity> {
    const tokenHash = await argon2.hash(options.refreshToken);

    const session = (await this.prisma.refreshSession.create({
      data: {
        id: options.sessionId,
        userId: options.userId,
        tokenHash,
        expiresAt: options.expiresAt,
        ip: options.metadata?.ip ?? null,
        userAgent: options.metadata?.userAgent ?? null,
      },
    })) as RefreshSessionEntity;

    await this.auditLogService.log(AuditAction.REFRESH_TOKEN_ROTATED, {
      actorUserId: options.userId,
      targetUserId: options.userId,
      entityType: 'RefreshSession',
      entityId: session.id,
      metadata: {
        action: 'created',
      },
      ip: options.metadata?.ip ?? null,
      userAgent: options.metadata?.userAgent ?? null,
    });

    return session;
  }

  async validateRefreshToken(
    sessionId: string,
    userId: string,
    refreshToken: string,
  ): Promise<RefreshSessionEntity> {
    const session = (await this.prisma.refreshSession.findUnique({
      where: { id: sessionId },
    })) as RefreshSessionEntity | null;

    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Invalid session');
    }

    if (session.revokedAt) {
      await this.revokeAllUserSessions(userId, 'refresh-token-reuse');
      throw new ForbiddenException('Refresh token has been revoked');
    }

    if (session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const isValid = await argon2.verify(session.tokenHash, refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token mismatch');
    }

    return session;
  }

  async revokeSession(
    sessionId: string,
    metadata?: RequestContext,
  ): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    await this.auditLogService.log(AuditAction.REFRESH_TOKEN_REVOKED, {
      actorUserId: metadata?.userId ?? null,
      targetUserId: metadata?.userId ?? null,
      entityType: 'RefreshSession',
      entityId: sessionId,
      metadata: { action: 'revoked' },
      ip: metadata?.ip ?? null,
      userAgent: metadata?.userAgent ?? null,
    });
  }

  async revokeAllUserSessions(userId: string, reason: string): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    await this.auditLogService.log(AuditAction.REFRESH_TOKEN_REVOKED, {
      actorUserId: userId,
      targetUserId: userId,
      entityType: 'RefreshSession',
      entityId: 'all',
      metadata: { reason },
    });
  }

  async deleteExpiredSessions(): Promise<number> {
    const result = await this.prisma.refreshSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        revokedAt: { not: null },
      },
    });
    return result.count;
  }
}
