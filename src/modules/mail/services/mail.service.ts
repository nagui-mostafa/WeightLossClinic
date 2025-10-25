import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly mailEnabled: boolean;
  private readonly appClientUrl: string | undefined;

  constructor(
    private readonly mailer: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.mailEnabled = Boolean(
      this.configService.get<string>('MAIL_HOST', '').trim(),
    );
    this.appClientUrl = this.configService.get<string>('CLIENT_APP_URL');
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    if (!this.mailEnabled) {
      this.logger.warn(
        `Mail transport not configured. Password reset token for ${email}: ${token}`,
      );
      return;
    }

    const resetLink = this.buildLink('auth/reset-password', token);

    await this.safeSendMail({
      to: email,
      subject: 'Password reset request',
      text: this.buildPasswordResetText(resetLink, token),
      html: this.buildPasswordResetHtml(resetLink, token),
    });
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    if (!this.mailEnabled) {
      this.logger.warn(
        `Mail transport not configured. Email verification token for ${email}: ${token}`,
      );
      return;
    }

    const verificationLink = this.buildLink('auth/verify-email', token);

    await this.safeSendMail({
      to: email,
      subject: 'Verify your email address',
      text: this.buildEmailVerificationText(verificationLink, token),
      html: this.buildEmailVerificationHtml(verificationLink, token),
    });
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    if (!this.mailEnabled) {
      this.logger.log(
        `Mail transport not configured. Skipping welcome email for ${email}`,
      );
      return;
    }

    await this.safeSendMail({
      to: email,
      subject: 'Welcome to Weight Loss Clinic',
      text: `Hi ${firstName},\n\nWelcome to Weight Loss Clinic! We're here to support your goals.\n\nBest regards,\nWeight Loss Clinic Team`,
      html: `<p>Hi ${firstName},</p><p>Welcome to <strong>Weight Loss Clinic</strong>! We're here to support your goals.</p><p>Best regards,<br/>Weight Loss Clinic Team</p>`,
    });
  }

  private async safeSendMail(
    options: Parameters<MailerService['sendMail']>[0],
  ) {
    try {
      await this.mailer.sendMail(options);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown mailer error';
      this.logger.error(`Failed to send email: ${message}`, error);
    }
  }

  private buildLink(path: string, token: string): string {
    if (!this.appClientUrl) {
      return token;
    }

    const url = new URL(this.appClientUrl);
    url.pathname = `${url.pathname.replace(/\/$/, '')}/${path}`;
    url.searchParams.set('token', token);
    return url.toString();
  }

  private buildPasswordResetText(linkOrToken: string, token: string): string {
    const isLink = linkOrToken !== token;
    const instructions = isLink
      ? `Reset your password using the link below:\n${linkOrToken}`
      : `Use the following one-time token to reset your password: ${token}`;

    return [
      'You requested a password reset for your Weight Loss Clinic account.',
      instructions,
      '\nIf you did not request this, please ignore this email.',
    ].join('\n\n');
  }

  private buildPasswordResetHtml(linkOrToken: string, token: string): string {
    const isLink = linkOrToken !== token;

    return isLink
      ? `<p>You requested a password reset for your Weight Loss Clinic account.</p>
        <p><a href="${linkOrToken}">Click here to reset your password</a></p>
        <p>If you did not request this, you can safely ignore this email.</p>`
      : `<p>You requested a password reset for your Weight Loss Clinic account.</p>
        <p>Use this one-time token to reset your password:</p>
        <p><code>${token}</code></p>
        <p>If you did not request this, you can safely ignore this email.</p>`;
  }

  private buildEmailVerificationText(
    linkOrToken: string,
    token: string,
  ): string {
    const isLink = linkOrToken !== token;
    const instructions = isLink
      ? `Verify your email using the link below:\n${linkOrToken}`
      : `Use the following one-time token to verify your email: ${token}`;

    return [
      'Thanks for signing up for Weight Loss Clinic.',
      instructions,
      '\nIf you did not create this account, please contact support.',
    ].join('\n\n');
  }

  private buildEmailVerificationHtml(
    linkOrToken: string,
    token: string,
  ): string {
    const isLink = linkOrToken !== token;

    return isLink
      ? `<p>Thanks for signing up for <strong>Weight Loss Clinic</strong>.</p>
        <p><a href="${linkOrToken}">Click here to verify your email address</a></p>
        `
      : `<p>Thanks for signing up for <strong>Weight Loss Clinic</strong>.</p>
        <p>Use this one-time token to verify your email:</p>
        <p><code>${token}</code></p>`;
  }
}
