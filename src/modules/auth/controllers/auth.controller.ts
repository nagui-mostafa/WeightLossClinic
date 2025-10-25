import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-tokens.dto';
import { Public, CurrentUser } from '../../common';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import type { AuthenticatedUser } from '../interfaces/request-with-user.interface';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Public()
  @ApiOperation({ summary: 'Patient signup' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  async signup(
    @Body() dto: SignupDto,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    return this.authService.signup(dto, this.toRequestContext(request));
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login and receive JWT tokens' })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    return this.authService.login(dto, this.toRequestContext(request));
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout and revoke current refresh session' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ): Promise<void> {
    await this.authService.logout(
      user,
      this.toRequestContext(request, user.id),
    );
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Refresh access token using a refresh token' })
  @ApiOkResponse({ type: AuthResponseDto })
  async refreshTokens(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(dto, this.toRequestContext(request));
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request password reset link' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() request: Request,
  ): Promise<void> {
    await this.authService.forgotPassword(dto, this.toRequestContext(request));
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset password using a token' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() request: Request,
  ): Promise<void> {
    await this.authService.resetPassword(dto, this.toRequestContext(request));
  }

  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Verify email using a token' })
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Req() request: Request,
  ): Promise<void> {
    await this.authService.verifyEmail(dto, this.toRequestContext(request));
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  async getMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    return this.authService.getMe(user.id);
  }

  private toRequestContext(request: Request, userId?: string) {
    return {
      requestId: (request as any).requestId,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      userId,
    };
  }
}
