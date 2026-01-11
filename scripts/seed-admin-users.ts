import * as argon2 from 'argon2';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const PASSWORD = '12345678';

const ADMIN_EMAILS = [
  'ahmed@joeymed.com',
  'karim@joeymed.com',
  'wala@joeymed.com',
  'matar@joeymed.com',
  'mayar@joeymed.com',
];

const hashPassword = async (plaintext: string) =>
  argon2.hash(plaintext, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 4,
    parallelism: 2,
  });

const capitalize = (value: string) =>
  value.length ? value[0].toUpperCase() + value.slice(1) : value;

const main = async () => {
  const passwordHash = await hashPassword(PASSWORD);
  let created = 0;
  let updated = 0;

  for (const email of ADMIN_EMAILS) {
    const normalized = email.toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true },
    });

    if (existing) {
      await prisma.user.update({
        where: { email: normalized },
        data: {
          role: Role.ADMIN,
          isActive: true,
          isEmailVerified: true,
          passwordHash,
        },
      });
      updated += 1;
      continue;
    }

    const localPart = normalized.split('@')[0] ?? 'Admin';
    const firstName = capitalize(localPart);

    await prisma.user.create({
      data: {
        email: normalized,
        passwordHash,
        role: Role.ADMIN,
        firstName,
        lastName: 'JoeyMed',
        isActive: true,
        isEmailVerified: true,
      },
    });
    created += 1;
  }

  console.log(
    `Admin seed complete. Created ${created}, updated ${updated}. Password applied to all listed accounts.`,
  );
};

main()
  .catch((error) => {
    console.error('Failed to seed admin users:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
