import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { RefreshJwtPayload } from '../interfaces/refresh-jwt-payload.interface';
import { RefreshTokenValidationResult } from '../interfaces/refresh-token-validation.interface';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private static readonly authHeaderExtractor =
    ExtractJwt.fromAuthHeaderAsBearerToken();

  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        RefreshTokenStrategy.extractFromBody,
        RefreshTokenStrategy.extractFromCookie,
        RefreshTokenStrategy.authHeaderExtractor,
      ]),
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
      ignoreExpiration: false,
    });
  }

  validate(
    req: Request,
    payload: RefreshJwtPayload,
  ): RefreshTokenValidationResult {
    const refreshToken =
      RefreshTokenStrategy.extractFromBody(req) ||
      RefreshTokenStrategy.extractFromCookie(req) ||
      RefreshTokenStrategy.authHeaderExtractor(req);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    return {
      userId: payload.sub,
      sessionId: payload.sid,
      jti: payload.jti,
      refreshToken,
    };
  }

  private static extractFromBody(req: Request): string | null {
    if (req.body && typeof req.body.refreshToken === 'string') {
      return req.body.refreshToken;
    }
    return null;
  }

  private static extractFromCookie(req: Request): string | null {
    const cookies = (req as any).cookies;
    if (cookies && typeof cookies.refreshToken === 'string') {
      return cookies.refreshToken;
    }
    return null;
  }
}
