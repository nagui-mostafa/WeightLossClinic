#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'GrouponInfo', 'data');
const DEFAULT_OUTPUT = path.join(DATA_DIR, 'combined-groupon-codes.csv');

const targets = [
  { dir: 'Semaglutide', product: 'Semaglutide' },
  { dir: 'Tirzepatide', product: 'Tirzepatide' },
];

function getPlanWeeks(fileName) {
  const match = fileName.match(/(\d+)-Week/i);
  if (!match) {
    throw new Error(`Unable to determine plan weeks from filename: ${fileName}`);
  }
  return match[1];
}

async function appendFileRows(filePath, product, planWeeks, writer, headerWritten) {
  const stream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let lineNo = 0;
  let wroteHeader = headerWritten;

  for await (const rawLine of rl) {
    const line = rawLine.replace(/\r$/, '');
    if (!line.trim()) {
      continue;
    }

    lineNo += 1;
    if (lineNo === 1) {
      if (!wroteHeader) {
        writer.write('Code,ProductName,PlanWeeks\n');
        wroteHeader = true;
      }
      continue;
    }

    const code = line.split(',')[0]?.trim();
    if (!code) {
      continue;
    }
    writer.write(`${code},${product},${planWeeks}\n`);
  }

  return wroteHeader;
}

async function main() {
  const outputPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_OUTPUT;
  const writer = fs.createWriteStream(outputPath, { encoding: 'utf8' });

  let headerWritten = false;
  for (const target of targets) {
    const dirPath = path.join(DATA_DIR, target.dir);
    const entries = fs.readdirSync(dirPath).filter((file) => file.endsWith('.csv'));
    entries.sort();

    for (const fileName of entries) {
      const planWeeks = getPlanWeeks(fileName);
      const filePath = path.join(dirPath, fileName);
      headerWritten = await appendFileRows(
        filePath,
        target.product,
        planWeeks,
        writer,
        headerWritten,
      );
    }
  }

  await new Promise((resolve) => writer.end(resolve));
  console.log(`Merged CSV written to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
