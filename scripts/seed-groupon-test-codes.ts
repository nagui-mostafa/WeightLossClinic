import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_CODES = [
  'TFZ3D9F9',
  'MZXBDKNY',
  'FQ7XEUMF',
  'WXCRVAE7',
  'Q62DUNE5',
].map((code) => code.trim().toUpperCase());

const TEST_PLAN = {
  planSlug: 'groupon:test',
  productToken: 'test',
  planWeeks: 0,
  dealName: 'Groupon Test Voucher',
};

async function seedTestCodes() {
  const data = TEST_CODES.map((code) => ({
    code,
    ...TEST_PLAN,
  }));

  const result = await prisma.grouponCodeCatalog.createMany({
    data,
    skipDuplicates: true,
  });

  console.log(
    `Seeded ${result.count} Groupon test codes (duplicates are skipped).`,
  );
}

seedTestCodes()
  .catch((error) => {
    console.error('Failed to seed Groupon test codes:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
