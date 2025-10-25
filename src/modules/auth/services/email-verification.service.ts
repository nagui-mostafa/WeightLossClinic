import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService, parseDurationToMs } from '../../common';

type EmailVerificationToken = Record<string, any>;

@Injectable()
export class EmailVerificationService {
  private readonly ttlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const ttl =
      this.configService.get<string>('EMAIL_VERIFICATION_TOKEN_TTL') ?? '24h';
    this.ttlMs = parseDurationToMs(ttl);
  }

  async issueToken(
    userId: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = randomBytes(48).toString('hex');
    const tokenHash = await argon2.hash(token);
    const expiresAt = new Date(Date.now() + this.ttlMs);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return { token, expiresAt };
  }

  async consumeToken(token: string): Promise<EmailVerificationToken> {
    const candidates = await this.prisma.emailVerificationToken.findMany({
      where: {
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const candidate of candidates) {
      const matches = await argon2.verify(candidate.tokenHash, token);
      if (matches) {
        if (candidate.usedAt) {
          throw new BadRequestException('Verification token already used');
        }
        if (candidate.expiresAt.getTime() < Date.now()) {
          throw new BadRequestException('Verification token expired');
        }

        const updated = await this.prisma.emailVerificationToken.update({
          where: { id: candidate.id },
          data: {
            usedAt: new Date(),
          },
        });

        return updated;
      }
    }

    throw new NotFoundException('Verification token not found');
  }
}
