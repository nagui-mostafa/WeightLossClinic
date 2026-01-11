import type { Prisma } from '@prisma/client';

type ActiveRecordFilterOptions = {
  /** Date that must be after the record startDate to count as active. Defaults to now. */
  currentDate?: Date;
  /**
   * Oldest acceptable endDate for the record. Defaults to currentDate so only in-progress
   * plans are matched unless overridden (e.g. for "active within last 30 days").
   */
  endDateLowerBound?: Date;
};

/**
 * Builds a Prisma filter that matches records with plans overlapping the desired window.
 */
export const buildActiveRecordFilter = (
  options: ActiveRecordFilterOptions = {},
): Prisma.RecordWhereInput => {
  const currentDate = options.currentDate ?? new Date();
  const endDateLowerBound = options.endDateLowerBound ?? currentDate;

  return {
    startDate: { lte: currentDate },
    OR: [
      { endDate: null },
      {
        endDate: {
          gte: endDateLowerBound,
        },
      },
    ],
  };
};

/**
 * Determines if a provided list of records contains at least one currently-active plan.
 */
export const hasActivePlanRecord = <
  T extends { startDate: Date; endDate: Date | null },
>(
  records: T[],
  now: Date = new Date(),
): boolean => {
  const timestamp = now.getTime();
  return records.some((record) => {
    const start = record.startDate.getTime();
    if (start > timestamp) {
      return false;
    }

    if (!record.endDate) {
      return true;
    }

    const end = record.endDate.getTime();
    return end >= timestamp;
  });
};
