import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { User as PrismaUserModel } from '@prisma/client';
import { AuthTokens } from '../interfaces/auth-tokens.interface';
import { parseDurationToMs } from '../../common';

type PrismaUser = PrismaUserModel & { [key: string]: unknown };

@Injectable()
export class TokensService {
  private readonly accessTokenTtl: string;
  private readonly refreshTokenTtl: string;
  private readonly accessTokenTtlMs: number;
  private readonly refreshTokenTtlMs: number;
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenTtl =
      this.configService.get<string>('ACCESS_TOKEN_TTL') ?? '15m';
    this.refreshTokenTtl =
      this.configService.get<string>('REFRESH_TOKEN_TTL') ?? '14d';

    this.accessTokenTtlMs = parseDurationToMs(this.accessTokenTtl);
    this.refreshTokenTtlMs = parseDurationToMs(this.refreshTokenTtl);

    this.accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ?? '';
    this.refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ?? '';
  }

  async generateTokens(
    user: PrismaUser,
    sessionId?: string,
  ): Promise<AuthTokens> {
    const sid = sessionId ?? randomUUID();
    const accessJti = randomUUID();
    const refreshJti = randomUUID();

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        sid,
      } as any,
      {
        secret: this.accessSecret,
        expiresIn: this.accessTokenTtl,
        jwtid: accessJti,
      } as any,
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        sid,
      } as any,
      {
        secret: this.refreshSecret,
        expiresIn: this.refreshTokenTtl,
        jwtid: refreshJti,
      } as any,
    );

    return {
      sessionId: sid,
      accessToken,
      refreshToken,
      expiresIn: Math.floor(this.accessTokenTtlMs / 1000),
      refreshExpiresIn: Math.floor(this.refreshTokenTtlMs / 1000),
    };
  }

  verifyRefreshToken(token: string) {
    return this.jwtService.verifyAsync(token, {
      secret: this.refreshSecret,
    });
  }

  decodeRefreshToken(token: string) {
    return this.jwtService.decode(token);
  }

  getAccessTokenTtlMs(): number {
    return this.accessTokenTtlMs;
  }

  getRefreshTokenTtlMs(): number {
    return this.refreshTokenTtlMs;
  }
}
