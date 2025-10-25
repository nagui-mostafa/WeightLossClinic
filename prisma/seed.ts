import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@weightlossclinic.com';
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD || 'ChangeMeNow!123';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail.toLowerCase() },
  });

  if (existingAdmin) {
    console.log(`Admin user ${adminEmail} already exists. Skipping seed.`);
    return;
  }

  const passwordHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 4,
    parallelism: 2,
  });

  await prisma.user.create({
    data: {
      email: adminEmail.toLowerCase(),
      passwordHash,
      role: 'ADMIN',
      firstName: 'System',
      lastName: 'Administrator',
      isEmailVerified: true,
    },
  });

  console.log(`Seeded admin user ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
