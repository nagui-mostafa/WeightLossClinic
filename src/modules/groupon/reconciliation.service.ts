import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../common';
import { GrouponService } from './groupon.service';

@Injectable()
export class GrouponReconciliationService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(GrouponReconciliationService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly grouponService: GrouponService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const enabled =
      this.configService.get<boolean>('groupon.reconciliationEnabled', {
        infer: true,
      }) ?? true;
    if (!enabled) {
      this.logger.log('Groupon reconciliation disabled');
      return;
    }

    // run once on startup
    this.runOnce().catch((err) =>
      this.logger.error('Reconciliation failed on startup', err),
    );

    // schedule daily
    this.timer = setInterval(
      () =>
        this.runOnce().catch((err) =>
          this.logger.error('Reconciliation failed on interval', err),
        ),
      24 * 60 * 60 * 1000,
    );
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runOnce(): Promise<void> {
    const useMock =
      this.configService.get<boolean>('groupon.useMock', { infer: true }) ??
      false;
    if (useMock) {
      this.logger.log('Skipping reconciliation because GROUPON_USE_MOCK=true');
      return;
    }

    const lookbackDays = 7;
    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    const redeemed = await this.prisma.grouponVoucher.findMany({
      where: {
        status: 'REDEEMED',
        updatedAt: { gte: since },
      },
      select: {
        id: true,
        redemptionCode: true,
        recordId: true,
      },
    });

    if (!redeemed.length) {
      return;
    }

    const adminIds = await this.getAdminIds();
    if (!adminIds.length) {
      this.logger.warn('No admins found to notify about Groupon mismatches');
    }

    for (const voucher of redeemed) {
      try {
        const voucherDto = await this.grouponService.fetchVoucherStatus(
          voucher.redemptionCode,
          { requestId: randomUUID() },
        );
        if (!voucherDto) {
          await this.notifyAdmins(
            adminIds,
            'Groupon voucher missing',
            `Voucher ${voucher.redemptionCode} could not be fetched during reconciliation.`,
            voucher.recordId,
          );
          continue;
        }
        if (voucherDto.status.toLowerCase() !== 'redeemed') {
          await this.notifyAdmins(
            adminIds,
            'Groupon status mismatch',
            `Voucher ${voucher.redemptionCode} is ${voucherDto.status} on Groupon but marked redeemed locally.`,
            voucher.recordId,
          );
        }
      } catch (error) {
        this.logger.warn(
          `Reconciliation check failed for ${voucher.redemptionCode}: ${error?.message}`,
        );
      }
    }
  }

  private async getAdminIds(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  }

  private async notifyAdmins(
    adminIds: string[],
    title: string,
    message: string,
    recordId?: string | null,
  ) {
    if (!adminIds.length) {
      return;
    }

    await this.prisma.userNotification.createMany({
      data: adminIds.map((id) => ({
        userId: id,
        title,
        message,
        recordId: recordId ?? null,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    });
  }
}
