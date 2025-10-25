import { Decimal } from '@prisma/client/runtime/library';

export function exclude<T extends Record<string, any>, K extends keyof T>(
  entity: T,
  keys: K[],
): Omit<T, K> {
  const clone = { ...entity };
  for (const key of keys) {
    delete clone[key];
  }
  return clone as Omit<T, K>;
}

export function decimalToNumber(value?: Decimal | null): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  return value.toNumber();
}
