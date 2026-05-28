import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import {
  getStatusKey,
  QUEUED_PSEUDO_STATUS,
  SIGNING_PSUEDO_STATUS,
} from '../../components/app/transaction-status-label';

const hidePlusSignActivityTypes = new Set<ActivityListItem['type']>([
  'approveSpendingCap',
  'increaseSpendingCap',
  'revokeSpendingCap',
]);

export function shouldShowPlusSign(activityType: ActivityListItem['type']) {
  return !hidePlusSignActivityTypes.has(activityType);
}

export function getActivityCellStatus(data: ActivityListItem) {
  const transactionGroup =
    data.raw?.type === 'localTransaction' ? data.raw.data : undefined;
  const { primaryTransaction } = transactionGroup ?? {};
  const isEarliestNonce = data.isEarliestNonce ?? false;

  let txStatus: string;
  if (
    primaryTransaction?.status === TransactionStatus.confirmed &&
    primaryTransaction.type === TransactionType.cancel
  ) {
    txStatus = 'cancelled';
  } else if (data.status === 'success') {
    txStatus = 'confirmed';
  } else {
    txStatus = data.status;
  }

  if (!primaryTransaction?.status) {
    return { txStatus };
  }

  const pendingSubtitleKey = getStatusKey(
    primaryTransaction.status,
    isEarliestNonce,
  );

  if (
    pendingSubtitleKey === SIGNING_PSUEDO_STATUS ||
    pendingSubtitleKey === QUEUED_PSEUDO_STATUS
  ) {
    return { txStatus, pendingSubtitleKey };
  }

  return { txStatus };
}

export type GroupedItem =
  | { type: 'pending-header' }
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
    if (item.status === 'pending') {
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
