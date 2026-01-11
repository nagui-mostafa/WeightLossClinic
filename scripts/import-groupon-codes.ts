/**
 * Bulk-import Groupon codes from the provided CSVs into the catalog table.
 *
 * Usage (dev):
 *   npx ts-node scripts/import-groupon-codes.ts
 *
 * Assumptions:
 * - CSV header: Code,Status,External_User_Redemption_Url,External_Redemption_Url
 * - Files live under GrouponInfo/data/{Semaglutide|Tirzepatide}/...
 */
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type PlanMeta = {
  planSlug: string;
  productToken: string;
  planWeeks: number;
  dealName: string;
};

const BASE_DIR = path.resolve(__dirname, '..', 'GrouponInfo', 'data');

const filePlanMap: Array<{ file: string; meta: PlanMeta }> = [
  {
    file:
      'Semaglutide/CODES_US_Joey-Med_4-Week-Semaglutide-Weight-Loss-Program_a0YUj00000rtZoEMAU_10000_2025-12-02.csv',
    meta: {
      planSlug: 'groupon:4-week-semaglutide',
      productToken: 'semaglutide',
      planWeeks: 4,
      dealName: '4-Week Semaglutide Weight Loss Program',
    },
  },
  {
    file:
      'Semaglutide/CODES_US_Joey-Med_6-Week-Semaglutide-Weight-Loss-Program_a0YUj00000rtonGMAQ_5000_2025-12-02.csv',
    meta: {
      planSlug: 'groupon:6-week-semaglutide',
      productToken: 'semaglutide',
      planWeeks: 6,
      dealName: '6-Week Semaglutide Weight Loss Program',
    },
  },
  {
    file:
      'Semaglutide/CODES_US_Joey-Med_8-Week-Semaglutide-Weight-Loss-Program_a0YUj00000rtonHMAQ_10000_2025-12-02.csv',
    meta: {
      planSlug: 'groupon:8-week-semaglutide',
      productToken: 'semaglutide',
      planWeeks: 8,
      dealName: '8-Week Semaglutide Weight Loss Program',
    },
  },
  {
    file:
      'Semaglutide/CODES_US_Joey-Med_12-Week-Semaglutide-Weight-Loss-Program_a0YUj00000rtonIMAQ_5000_2025-12-02.csv',
    meta: {
      planSlug: 'groupon:12-week-semaglutide',
      productToken: 'semaglutide',
      planWeeks: 12,
      dealName: '12-Week Semaglutide Weight Loss Program',
    },
  },
  {
    file:
      'Tirzepatide/CODES_US_Joey-Med_4-Week-Tirzepatide-Weight-Loss-Program_a0YUj00000rtonJMAQ_5000_2025-12-02.csv',
    meta: {
      planSlug: 'groupon:4-week-tirzepatide',
      productToken: 'tirzepatide',
      planWeeks: 4,
      dealName: '4-Week Tirzepatide Weight Loss Program',
    },
  },
  {
    file:
      'Tirzepatide/CODES_US_Joey-Med_6-Week-Tirzepatide-Weight-Loss-Program_a0YUj00000rtonKMAQ_5000_2025-12-02.csv',
    meta: {
      planSlug: 'groupon:6-week-tirzepatide',
      productToken: 'tirzepatide',
      planWeeks: 6,
      dealName: '6-Week Tirzepatide Weight Loss Program',
    },
  },
  {
    file:
      'Tirzepatide/CODES_US_Joey-Med_8-Week-Tirzepatide-Weight-Loss-Program_a0YUj00000rtonLMAQ_10000_2025-12-02.csv',
    meta: {
      planSlug: 'groupon:8-week-tirzepatide',
      productToken: 'tirzepatide',
      planWeeks: 8,
      dealName: '8-Week Tirzepatide Weight Loss Program',
    },
  },
  {
    file:
      'Tirzepatide/CODES_US_Joey-Med_12-Week-Tirzepatide-Weight-Loss-Program_a0YUj00000rtonMMAQ_10000_2025-12-02.csv',
    meta: {
      planSlug: 'groupon:12-week-tirzepatide',
      productToken: 'tirzepatide',
      planWeeks: 12,
      dealName: '12-Week Tirzepatide Weight Loss Program',
    },
  },
];

async function importFile(filePath: string, meta: PlanMeta) {
  const abs = path.join(BASE_DIR, filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`File not found: ${abs}`);
  }

  const stream = fs.createReadStream(abs);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let lineNo = 0;
  const batchSize = 1000;
  let batch: any[] = [];
  let total = 0;

  for await (const line of rl) {
    lineNo += 1;
    if (lineNo === 1) continue; // skip header
    const cols = line.split(',');
    const code = cols[0]?.trim().toUpperCase();
    if (!code) continue;

    batch.push({
      code,
      planSlug: meta.planSlug,
      productToken: meta.productToken,
      planWeeks: meta.planWeeks,
      dealName: meta.dealName,
    });

    if (batch.length >= batchSize) {
      await upsertBatch(batch);
      total += batch.length;
      batch = [];
    }
  }

  if (batch.length) {
    await upsertBatch(batch);
    total += batch.length;
  }

  console.log(`Imported ${total} codes from ${filePath}`);
}

async function upsertBatch(rows: any[]) {
  await prisma.grouponCodeCatalog.createMany({
    data: rows,
    skipDuplicates: true,
  });
}

async function main() {
  for (const entry of filePlanMap) {
    await importFile(entry.file, entry.meta);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
