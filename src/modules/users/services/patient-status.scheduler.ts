import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService, Role } from '../../common';
import { UsersService } from './users.service';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 100;

@Injectable()
export class PatientStatusScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PatientStatusScheduler.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  onModuleInit(): void {
    this.logger.log('Initializing patient status scheduler');
    this.startTimer();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private startTimer(): void {
    void this.runSync('startup');
    this.timer = setInterval(() => {
      void this.runSync('interval');
    }, ONE_DAY_MS);

    // Prevent keeping the event loop alive if nothing else is running.
    this.timer.unref?.();
  }

  private async runSync(trigger: 'startup' | 'interval'): Promise<void> {
    const runId = `${trigger}-${Date.now()}`;
    this.logger.log(`Patient status sync started (${runId})`);
    const now = new Date();
    let cursor: string | undefined;
    let processed = 0;

    try {
      while (true) {
        const patients = await this.prisma.user.findMany({
          where: { role: Role.PATIENT },
          select: { id: true },
          take: BATCH_SIZE,
          orderBy: { id: 'asc' },
          ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        });

        if (patients.length === 0) {
          break;
        }

        for (const patient of patients) {
          await this.usersService.syncUserActiveStatus(patient.id, now);
          processed += 1;
        }

        cursor = patients[patients.length - 1].id;
      }

      this.logger.log(
        `Patient status sync finished (${runId}) - processed ${processed} patient(s)`,
      );
    } catch (error) {
      this.logger.error(
        `Patient status sync failed (${runId}): ${(error as Error).message}`,
        error as Error,
      );
    }
  }
}
