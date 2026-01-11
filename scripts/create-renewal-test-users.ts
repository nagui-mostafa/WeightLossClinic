import { PrismaClient, MedicationType, ProductCategory } from '@prisma/client';
import * as argon2 from 'argon2';

type RecordSeed = {
  medication: string;
  medicationType?: MedicationType;
  category?: ProductCategory;
  startDate: string;
  endDate?: string;
  purchasedAt: string;
  renewalDate?: string;
  notes?: string;
};

type PatientSeed = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password: string;
  records: RecordSeed[];
};

const prisma = new PrismaClient();

const patients: PatientSeed[] = [
  {
    email: 'renewal.reminder.ada@joeymed.com',
    firstName: 'Ada',
    lastName: 'Renewal',
    phone: '5553102001',
    password: 'Patient123!',
    records: [
      {
        medication: 'Semaglutide Core Plan',
        medicationType: MedicationType.INJECTABLE,
        category: ProductCategory.WEIGHT_LOSS,
        startDate: '2025-11-18T12:00:00.000Z',
        endDate: '2025-12-18T12:00:00.000Z',
        purchasedAt: '2025-11-15T15:00:00.000Z',
        renewalDate: '2025-12-27T15:00:00.000Z',
        notes: 'Renewal due within 3 days of today to test reminders.',
      },
      {
        medication: 'Semaglutide Maintenance Plan',
        medicationType: MedicationType.INJECTABLE,
        category: ProductCategory.WEIGHT_LOSS,
        startDate: '2025-08-01T12:00:00.000Z',
        endDate: '2025-09-01T12:00:00.000Z',
        purchasedAt: '2025-07-28T15:00:00.000Z',
        renewalDate: '2026-01-20T15:00:00.000Z',
        notes: 'Background record for history.',
      },
    ],
  },
  {
    email: 'renewal.reminder.bea@joeymed.com',
    firstName: 'Bea',
    lastName: 'Renewal',
    phone: '5553102002',
    password: 'Patient123!',
    records: [
      {
        medication: 'Tirzepatide Complete Program',
        medicationType: MedicationType.INJECTABLE,
        category: ProductCategory.WEIGHT_LOSS,
        startDate: '2025-11-10T12:00:00.000Z',
        endDate: '2025-12-10T12:00:00.000Z',
        purchasedAt: '2025-11-05T15:00:00.000Z',
        renewalDate: '2025-12-26T15:00:00.000Z',
        notes: 'Renewal due within 48 hours of today to test alerts.',
      },
      {
        medication: 'Tirzepatide Step-Down Plan',
        medicationType: MedicationType.INJECTABLE,
        category: ProductCategory.WEIGHT_LOSS,
        startDate: '2025-09-05T12:00:00.000Z',
        endDate: '2025-10-05T12:00:00.000Z',
        purchasedAt: '2025-09-01T15:00:00.000Z',
        renewalDate: '2026-02-01T15:00:00.000Z',
        notes: 'Second record for the same patient.',
      },
    ],
  },
];

const toDate = (value: string | undefined) =>
  value ? new Date(value) : undefined;

async function upsertPatient(seed: PatientSeed) {
  const existing = await prisma.user.findUnique({
    where: { email: seed.email },
  });

  const passwordHash = await argon2.hash(seed.password);

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          firstName: seed.firstName,
          lastName: seed.lastName,
          phone: seed.phone,
          passwordHash,
          isActive: true,
        },
      })
    : await prisma.user.create({
        data: {
          email: seed.email,
          firstName: seed.firstName,
          lastName: seed.lastName,
          phone: seed.phone,
          passwordHash,
          isEmailVerified: true,
          isActive: true,
        },
      });

  await prisma.record.deleteMany({ where: { userId: user.id } });

  for (const record of seed.records) {
    await prisma.record.create({
      data: {
        userId: user.id,
        medication: record.medication,
        medicationType: record.medicationType,
        category: record.category,
        startDate: toDate(record.startDate) ?? new Date(),
        endDate: toDate(record.endDate),
        purchasedAt: toDate(record.purchasedAt) ?? new Date(),
        renewalDate: toDate(record.renewalDate),
        notes: record.notes,
      },
    });
  }

  return user;
}

async function main() {
  for (const patient of patients) {
    const user = await upsertPatient(patient);
    console.log(
      `Seeded patient ${user.firstName} ${user.lastName} (${user.email}) with ${patient.records.length} records.`,
    );
  }
}

main()
  .catch((error) => {
    console.error('Failed to seed renewal test patients:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
