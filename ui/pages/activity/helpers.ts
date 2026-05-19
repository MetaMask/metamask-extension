import type { ActivityListItem } from '../../../shared/lib/activity/types';

export type GroupedItem =
  | { type: 'date-header'; date: number }
  | { type: 'item'; item: ActivityListItem };

function getItemHash(item: ActivityListItem) {
  return item.data.hash?.toLowerCase();
}

function parseDate(timestamp: number) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function dedupeItems(...sources: ActivityListItem[][]) {
  const hashes = new Set<string>();

  return sources
    .flatMap((items) =>
      items.filter((item) => {
        const hash = getItemHash(item);

        if (!hash) {
          return true;
        }

        if (hashes.has(hash)) {
          return false;
        }

        hashes.add(hash);
        return true;
      }),
    )
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function groupItemsByDate(items: ActivityListItem[]) {
  let currentDate: number | null = null;

  return items.flatMap((item): GroupedItem[] => {
    const date = parseDate(item.timestamp);

    if (date === currentDate) {
      return [{ type: 'item', item }];
    }

    currentDate = date;
    return [
      { type: 'date-header', date },
      { type: 'item', item },
    ];
  });
}

export function getItemKey(row: GroupedItem, index: number) {
  if (row.type === 'date-header') {
    return `date-header:${row.date}`;
  }

  return `${row.item.chainId}:${row.item.timestamp}:${row.item.type}:${index}`;
}
