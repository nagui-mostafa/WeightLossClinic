import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as argon2 from 'argon2';
import {
  PrismaService,
  AuditLogService,
  parseDurationToMs,
  AuditAction,
} from '../../common';

type PasswordResetToken = Record<string, any>;

@Injectable()
export class PasswordResetService {
  private readonly ttlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditLogService: AuditLogService,
  ) {
    const ttl =
      this.configService.get<string>('PASSWORD_RESET_TOKEN_TTL') ?? '15m';
    this.ttlMs = parseDurationToMs(ttl);
  }

  async issueToken(
    userId: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = this.generateToken();
    const tokenHash = await argon2.hash(token);
    const expiresAt = new Date(Date.now() + this.ttlMs);

    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    await this.auditLogService.log(AuditAction.PASSWORD_RESET_REQUESTED, {
      actorUserId: userId,
      targetUserId: userId,
      entityType: 'PasswordResetToken',
      metadata: { expiresAt },
    });

    return { token, expiresAt };
  }

  async consumeToken(token: string): Promise<PasswordResetToken> {
    const tokens = await this.prisma.passwordResetToken.findMany({
      where: {
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const candidate of tokens) {
      const matches = await argon2.verify(candidate.tokenHash, token);
      if (matches) {
        if (candidate.usedAt) {
          throw new BadRequestException('Token already used');
        }
        if (candidate.expiresAt.getTime() < Date.now()) {
          throw new BadRequestException('Token expired');
        }

        const updated = await this.prisma.passwordResetToken.update({
          where: { id: candidate.id },
          data: { usedAt: new Date() },
        });

        await this.auditLogService.log(AuditAction.PASSWORD_RESET_COMPLETED, {
          actorUserId: candidate.userId,
          targetUserId: candidate.userId,
          entityType: 'PasswordResetToken',
          entityId: candidate.id,
        });

        return updated;
      }
    }

    throw new NotFoundException('Reset token not found');
  }

  async invalidateUserTokens(userId: string): Promise<void> {
    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        usedAt: new Date(),
      },
    });
  }

  private generateToken(): string {
    return randomBytes(48).toString('hex');
  }
}
