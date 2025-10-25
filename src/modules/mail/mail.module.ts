import { Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '../config';
import { ConfigService } from '@nestjs/config';
import { MailService } from './services/mail.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('MAIL_HOST', 'localhost');
        const port = configService.get<number>('MAIL_PORT', 587);
        const user = configService.get<string>('MAIL_USER', '');
        const pass = configService.get<string>('MAIL_PASS', '');
        const from = configService.get<string>(
          'MAIL_FROM',
          'noreply@weightlossclinic.com',
        );

        const transport: Record<string, unknown> = {
          host,
          port,
          secure: port === 465,
        };

        if (user && pass) {
          transport['auth'] = { user, pass };
        }

        return {
          transport,
          defaults: {
            from,
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
