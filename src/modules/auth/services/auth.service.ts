import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { User as PrismaUserModel } from '@prisma/client';
import { UsersService } from '../../users/services/users.service';
import {
  PasswordService,
  PrismaService,
  AuditLogService,
  AuditAction,
  Role,
} from '../../common';
import { AdminService } from '../../admin/services/admin.service';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { TokensService } from './tokens.service';
import { SessionsService } from './sessions.service';
import { PasswordResetService } from './password-reset.service';
import { EmailVerificationService } from './email-verification.service';
import { MailService } from '../../mail/services/mail.service';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-tokens.dto';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { AuthTokens } from '../interfaces/auth-tokens.interface';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AuthenticatedUser } from '../interfaces/request-with-user.interface';

type PrismaUser = PrismaUserModel & { [key: string]: unknown };

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly tokensService: TokensService,
    private readonly sessionsService: SessionsService,
    private readonly passwordResetService: PasswordResetService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly adminService: AdminService,
  ) {}

  async signup(
    dto: SignupDto,
    context: RequestContext,
  ): Promise<AuthResponseDto> {
    const emailVerificationEnabled =
      this.configService.get<boolean>('EMAIL_VERIFICATION_ENABLED') ?? false;

    const userResponse = await this.usersService.createPatient(dto, context, {
      autoVerifyEmail: !emailVerificationEnabled,
    });

    const user = (await this.usersService.findByEmail(
      dto.email.toLowerCase(),
    )) as PrismaUser | null;
    if (!user) {
      throw new InternalServerErrorException('User not found after signup');
    }

    await this.mailService.sendWelcomeEmail(user.email, user.firstName);

    if (emailVerificationEnabled) {
      const { token } = await this.emailVerificationService.issueToken(user.id);
      await this.mailService.sendEmailVerification(user.email, token);

      return {
        tokens: undefined,
        user: userResponse,
        requiresEmailVerification: true,
      };
    }

    const tokens = await this.generateAndPersistTokens(user, context);

    return {
      tokens: this.toAuthTokensDto(tokens),
      user: userResponse,
      requiresEmailVerification: false,
    };
  }

  async login(
    dto: LoginDto,
    context: RequestContext,
  ): Promise<AuthResponseDto> {
    const user = (await this.usersService.findByEmail(
      dto.email.toLowerCase(),
    )) as PrismaUser | null;

    if (!user) {
      await this.logLoginFailure(dto.email, context);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.syncUserActiveStatus(user);

    const passwordMatches = await this.passwordService.verifyPassword(
      user.passwordHash,
      dto.password,
    );

    if (!passwordMatches) {
      await this.logLoginFailure(dto.email, context);
      throw new UnauthorizedException('Invalid credentials');
    }

    const emailVerificationEnabled =
      this.configService.get<boolean>('EMAIL_VERIFICATION_ENABLED') ?? false;

    if (emailVerificationEnabled && !user.isEmailVerified) {
      throw new ForbiddenException('Email address not verified');
    }

    const tokens = await this.generateAndPersistTokens(user, context);
    const userDto = await this.usersService.getUserWithRecords(user.id);
    const enrichedUser = await this.attachAdminStats(userDto);

    await this.auditLogService.log(AuditAction.LOGIN_SUCCESS, {
      actorUserId: user.id,
      targetUserId: user.id,
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email },
      ip: context.ip ?? null,
      userAgent: context.userAgent ?? null,
    });

    return {
      tokens: this.toAuthTokensDto(tokens),
      user: enrichedUser,
      requiresEmailVerification: false,
    };
  }

  async logout(
    user: AuthenticatedUser,
    context: RequestContext,
  ): Promise<void> {
    if (user.sessionId) {
      await this.sessionsService.revokeSession(user.sessionId, {
        ...context,
        userId: user.id,
      });
    }

    await this.auditLogService.log(AuditAction.LOGOUT, {
      actorUserId: user.id,
      targetUserId: user.id,
      entityType: 'User',
      entityId: user.id,
      metadata: { action: 'logout' },
      ip: context.ip ?? null,
      userAgent: context.userAgent ?? null,
    });
  }

  async refreshTokens(
    dto: RefreshTokenDto,
    context: RequestContext,
  ): Promise<AuthResponseDto> {
    const decoded = await this.tokensService.verifyRefreshToken(
      dto.refreshToken,
    );

    const sessionId = decoded.sid;
    const userId = decoded.sub;

    const session = await this.sessionsService.validateRefreshToken(
      sessionId,
      userId,
      dto.refreshToken,
    );

    await this.sessionsService.revokeSession(sessionId, {
      ...context,
      userId,
    });

    const user = (await this.usersService.findByIdOrThrow(
      userId,
    )) as PrismaUser;

    await this.usersService.syncUserActiveStatus(user);

    const tokens = await this.generateAndPersistTokens(user, context);
    const userProfile = await this.usersService.getUserWithRecords(userId);
    const enrichedUser = await this.attachAdminStats(userProfile);

    await this.auditLogService.log(AuditAction.REFRESH_TOKEN_ROTATED, {
      actorUserId: userId,
      targetUserId: userId,
      entityType: 'RefreshSession',
      entityId: session.id,
      metadata: { rotatedTo: tokens.sessionId },
      ip: context.ip ?? null,
      userAgent: context.userAgent ?? null,
    });

    return {
      tokens: this.toAuthTokensDto(tokens),
      user: enrichedUser,
    };
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
    context: RequestContext,
  ): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email.toLowerCase());

    if (!user) {
      return;
    }

    const isActive = await this.usersService.isUserActive(user);
    if (!isActive) {
      return;
    }

    const { token } = await this.passwordResetService.issueToken(user.id);
    await this.mailService.sendPasswordResetEmail(user.email, token);

    await this.auditLogService.log(AuditAction.PASSWORD_RESET_REQUESTED, {
      actorUserId: user.id,
      targetUserId: user.id,
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email },
      ip: context.ip ?? null,
      userAgent: context.userAgent ?? null,
    });
  }

  async resetPassword(
    dto: ResetPasswordDto,
    context: RequestContext,
  ): Promise<void> {
    const tokenRecord = await this.passwordResetService.consumeToken(dto.token);
    const user = await this.usersService.findByIdOrThrow(tokenRecord.userId);

    const newHash = await this.passwordService.hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
      },
    });

    await this.sessionsService.revokeAllUserSessions(user.id, 'password-reset');
    await this.passwordResetService.invalidateUserTokens(user.id);

    await this.auditLogService.log(AuditAction.PASSWORD_RESET_COMPLETED, {
      actorUserId: user.id,
      targetUserId: user.id,
      entityType: 'User',
      entityId: user.id,
      metadata: { requestId: context.requestId },
    });
  }

  async verifyEmail(
    dto: VerifyEmailDto,
    context: RequestContext,
  ): Promise<void> {
    const tokenRecord = await this.emailVerificationService.consumeToken(
      dto.token,
    );

    const user = await this.usersService.findByIdOrThrow(tokenRecord.userId);

    if (!user.isEmailVerified) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
        },
      });

      await this.auditLogService.log(AuditAction.EMAIL_VERIFIED, {
        actorUserId: user.id,
        targetUserId: user.id,
        entityType: 'User',
        entityId: user.id,
        metadata: { requestId: context.requestId },
      });
    }
  }

  async getMe(userId: string) {
    const userDto = await this.usersService.getUserWithRecords(userId);
    return this.attachAdminStats(userDto);
  }

  private async generateAndPersistTokens(
    user: PrismaUser,
    context: RequestContext,
  ): Promise<AuthTokens> {
    const tokens = await this.tokensService.generateTokens(user);

    await this.sessionsService.createSession({
      sessionId: tokens.sessionId,
      userId: user.id,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(
        Date.now() + this.tokensService.getRefreshTokenTtlMs(),
      ),
      metadata: { ...(context ?? {}), userId: user.id },
    });

    return tokens;
  }

  private async logLoginFailure(
    email: string,
    context: RequestContext,
  ): Promise<void> {
    const user = await this.usersService.findByEmail(email.toLowerCase());
    await this.auditLogService.log(AuditAction.LOGIN_FAILED, {
      actorUserId: user?.id ?? null,
      targetUserId: user?.id ?? null,
      entityType: 'User',
      metadata: { email },
      ip: context.ip ?? null,
      userAgent: context.userAgent ?? null,
    });
  }

  private toAuthTokensDto(tokens: AuthTokens) {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      refreshExpiresIn: tokens.refreshExpiresIn,
    };
  }

  private async attachAdminStats(
    userDto: UserResponseDto,
  ): Promise<UserResponseDto> {
    if (userDto.profile.role !== Role.ADMIN) {
      return userDto;
    }

    const stats = await this.adminService.getStats();
    const notifications =
      await this.usersService.getRecentNotifications(5);

    return {
      ...userDto,
      notifications,
      adminStats: stats,
    };
  }
}
