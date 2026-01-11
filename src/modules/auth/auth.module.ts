import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule } from '../common/common.module';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { ConfigModule } from '../config';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { TokensService } from './services/tokens.service';
import { SessionsService } from './services/sessions.service';
import { PasswordResetService } from './services/password-reset.service';
import { EmailVerificationService } from './services/email-verification.service';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    CommonModule,
    UsersModule,
    MailModule,
    ConfigModule,
    AdminModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokensService,
    SessionsService,
    PasswordResetService,
    EmailVerificationService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    JwtRefreshGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService, TokensService, SessionsService],
})
export class AuthModule {}
