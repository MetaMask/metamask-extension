import type { MoneyActivityItem } from '../types/money-activity';
import { getMoneyActivityStatus } from './classify-money-activity';

export type MoneyActivitySection = {
  title: string;
  data: MoneyActivityItem[];
  isPending?: boolean;
};

/**
 * YYYY-MM-DD in UTC, matching the day the row is grouped under.
 *
 * @param time - Unix epoch milliseconds.
 * @returns Date key such as `2026-05-10`.
 */
export function getMoneyActivityDateKeyUtc(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

/**
 * Formats a UTC date key as a short month/day/year header ("May 10, 2026").
 * Pinned to `en-US` and UTC so the label names the same day as
 * {@link getMoneyActivityDateKeyUtc}.
 *
 * @param dateKey - UTC `YYYY-MM-DD` key.
 * @returns Localized date header.
 */
export function formatMoneyActivityDateHeader(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function isPendingItem(item: MoneyActivityItem): boolean {
  return getMoneyActivityStatus(item.tx) === 'pending';
}

function groupByDate(items: MoneyActivityItem[]): MoneyActivitySection[] {
  const groups = new Map<string, MoneyActivityItem[]>();
  for (const item of items) {
    const key = getMoneyActivityDateKeyUtc(item.time);
    const existing = groups.get(key);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(key, [item]);
    }
  }

  return Array.from(groups.entries()).map(([dateKey, data]) => ({
    title: formatMoneyActivityDateHeader(dateKey),
    data,
  }));
}

/**
 * Builds list sections: in-flight rows under a single Pending header, then
 * confirmed and failed rows grouped by UTC date (newest day first).
 *
 * @param items - Filter-bucket items, already newest-first.
 * @param pendingTitle - i18n label for the pending section.
 * @returns Sections to render on the Activity page.
 */
export function groupMoneyActivityItems(
  items: MoneyActivityItem[],
  pendingTitle: string,
): MoneyActivitySection[] {
  const pending: MoneyActivityItem[] = [];
  const settled: MoneyActivityItem[] = [];
  for (const item of items) {
    if (isPendingItem(item)) {
      pending.push(item);
    } else {
      settled.push(item);
    }
  }

  const dateSections = groupByDate(settled);
  if (pending.length === 0) {
    return dateSections;
  }

  return [
    {
      title: pendingTitle,
      data: pending,
      isPending: true,
    },
    ...dateSections,
  ];
}
