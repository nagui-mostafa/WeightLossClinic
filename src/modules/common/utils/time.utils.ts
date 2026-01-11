export function parseDurationToMs(input: string): number {
  if (!input) {
    throw new Error('Duration input is required');
  }

  const trimmed = input.trim();
  const numeric = Number(trimmed);

  if (!Number.isNaN(numeric) && numeric >= 0) {
    return numeric;
  }

  const regex = /^(\d+)(ms|s|m|h|d)$/i;
  const match = trimmed.match(regex);

  if (!match) {
    throw new Error(`Invalid duration format: "${input}"`);
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'ms':
      return value;
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unsupported duration unit: "${unit}"`);
  }
}

export function addMilliseconds(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function formatRelativeTime(
  date: Date,
  base: Date = new Date(),
): string {
  const diffMs = base.getTime() - date.getTime();
  const absDiffMs = Math.abs(diffMs);

  const units = [
    { label: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
    { label: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
    { label: 'week', ms: 1000 * 60 * 60 * 24 * 7 },
    { label: 'day', ms: 1000 * 60 * 60 * 24 },
    { label: 'hour', ms: 1000 * 60 * 60 },
    { label: 'minute', ms: 1000 * 60 },
    { label: 'second', ms: 1000 },
  ];

  for (const unit of units) {
    if (absDiffMs >= unit.ms) {
      const value = Math.round(absDiffMs / unit.ms);
      const pluralized = value === 1 ? unit.label : `${unit.label}s`;
      return diffMs >= 0
        ? `${value} ${pluralized} ago`
        : `in ${value} ${pluralized}`;
    }
  }

  return 'just now';
}
