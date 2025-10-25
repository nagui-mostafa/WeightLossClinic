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
