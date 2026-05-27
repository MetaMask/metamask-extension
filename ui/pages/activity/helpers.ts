import type { ActivityListItem } from '../../../shared/lib/activity/types';

const FIAT_DISPLAY_ACTIVITY_TYPES = new Set<ActivityListItem['type']>([
  'send',
  'receive',
  'buy',
  'deposit',
  'claim',
  'claimMusdBonus',
  'lendingWithdrawal',
  'nftMint',
  'contractInteraction',
  'swapIncomplete',
]);

const SECONDARY_TOKEN_ACTIVITY_TYPES = new Set<ActivityListItem['type']>([
  'swap',
  'bridge',
  'convert',
  'lendingDeposit',
  'lendingWithdrawal',
]);

const APPROVAL_ACTIVITY_TYPES = new Set<ActivityListItem['type']>([
  'approveSpendingCap',
  'increaseSpendingCap',
  'revokeSpendingCap',
]);

export function isApprovalActivityType(
  type: ActivityListItem['type'],
): boolean {
  return APPROVAL_ACTIVITY_TYPES.has(type);
}

export function shouldShowFiatDisplay(item: ActivityListItem): boolean {
  return FIAT_DISPLAY_ACTIVITY_TYPES.has(item.type);
}

export function shouldShowSecondaryTokenAmount(
  type: ActivityListItem['type'],
): boolean {
  return SECONDARY_TOKEN_ACTIVITY_TYPES.has(type);
}

export function getActivityTypeSignOptions(
  activityType: ActivityListItem['type'],
): { showPlus: boolean } {
  return { showPlus: !isApprovalActivityType(activityType) };
}

export type GroupedItem =
  | { type: 'pending-header' }
  | { type: 'date-header'; date: number }
  | { type: 'item'; item: ActivityListItem };

/**
 * Whether an activity row belongs in the Pending section.
 * Aligns with activity-v2 `isActivityPendingMergedItem`: adapters map
 * in-flight local, smart-transaction, and non-EVM keyring states to `pending`.
 *
 * @param item - A normalized activity list item.
 * @returns True if the row should appear under the Pending header.
 */
export function isActivityPendingListItem(item: ActivityListItem): boolean {
  return item.status === 'pending';
}

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

function groupItemsByDate(items: ActivityListItem[]): GroupedItem[] {
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

/**
 * Groups activity items for the list: optional Pending section (no date
 * headers), then date-grouped historical rows.
 *
 * @param items - Items sorted newest-first.
 */
export function groupActivityListItems(
  items: ActivityListItem[],
): GroupedItem[] {
  const pending: ActivityListItem[] = [];
  const historical: ActivityListItem[] = [];

  for (const item of items) {
    if (isActivityPendingListItem(item)) {
      pending.push(item);
    } else {
      historical.push(item);
    }
  }

  const grouped: GroupedItem[] = [];

  if (pending.length > 0) {
    grouped.push({ type: 'pending-header' });
    for (const item of pending) {
      grouped.push({ type: 'item', item });
    }
  }

  grouped.push(...groupItemsByDate(historical));

  return grouped;
}

export function getItemKey(row: GroupedItem, index: number) {
  if (row.type === 'pending-header') {
    return 'pending-header';
  }

  if (row.type === 'date-header') {
    return `date-header:${row.date}`;
  }

  return `${row.item.chainId}:${row.item.timestamp}:${row.item.type}:${index}`;
}
