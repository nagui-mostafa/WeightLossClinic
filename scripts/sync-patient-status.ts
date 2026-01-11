import { PrismaClient, Role } from '@prisma/client';
import { buildActiveRecordFilter } from '../src/modules/users/utils/patient-status.util';

const prisma = new PrismaClient();

async function syncPatientStatuses(): Promise<void> {
  const now = new Date();
  const users = await prisma.user.findMany({
    select: { id: true, role: true, isActive: true },
  });

  let updated = 0;

  for (const user of users) {
    const role = user.role;
    const derived =
      role === Role.PATIENT
        ? Boolean(
            await prisma.record.findFirst({
              where: {
                userId: user.id,
                ...buildActiveRecordFilter({ currentDate: now }),
              },
              select: { id: true },
            }),
          )
        : true;

    if (user.isActive !== derived) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: derived },
      });
      updated += 1;
    }
  }

  console.log(`Patient status sync complete. Updated ${updated} user(s).`);
}

syncPatientStatuses()
  .catch((error) => {
    console.error('Failed to sync patient statuses', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
