import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { CaipAssetType } from '@metamask/utils';
import { useSelector } from 'react-redux';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import { isEqualCaseInsensitive } from '../../../shared/lib/string-utils';
import { selectLocalTransactionsByHash } from '../../selectors/activity';
import {
  getStatusKey,
  QUEUED_PSEUDO_STATUS,
  SIGNING_PSUEDO_STATUS,
} from '../../components/app/transaction-status-label';
import type { TransactionGroup } from '../../../shared/lib/multichain/types';

export type ActivityListFilter =
  | { assetId: CaipAssetType }
  | { networks: string[] };

export function activityMatchesAssetId(
  item: ActivityListItem,
  assetId: CaipAssetType,
) {
  const { data } = item;
  const tokenAssetIds = [
    'token' in data ? data.token?.assetId : undefined,
    'sourceToken' in data ? data.sourceToken?.assetId : undefined,
    'destinationToken' in data ? data.destinationToken?.assetId : undefined,
  ];

  return tokenAssetIds.some(
    (tokenAssetId) =>
      tokenAssetId && isEqualCaseInsensitive(tokenAssetId, assetId),
  );
}

function getActivityCellStatus(
  data: ActivityListItem,
  transactionGroup?: TransactionGroup,
): {
  txStatus: string;
  pendingSubtitleKey?: string;
} {
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

export function useActivityCellStatus(data: ActivityListItem): {
  txStatus: string;
  pendingSubtitleKey?: string;
  transactionGroup?: TransactionGroup;
} {
  const localTransactionsByHash = useSelector(selectLocalTransactionsByHash);
  const transactionGroup = data.hash
    ? localTransactionsByHash.get(data.hash.toLowerCase())
    : undefined;

  return {
    ...getActivityCellStatus(data, transactionGroup),
    transactionGroup,
  };
}

export type GroupedItem =
  | { type: 'pending-header' }
  | { type: 'date-header'; date: number }
  | { type: 'item'; item: ActivityListItem };

function getItemHash(item: ActivityListItem) {
  return item.hash?.toLowerCase();
}

function parseDate(timestamp: number) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function dedupeItems(...sources: ActivityListItem[][]) {
  const dedupedItems: ActivityListItem[] = [];

  for (const item of sources.flat()) {
    const hash = getItemHash(item);

    if (!hash) {
      dedupedItems.push(item);
      continue;
    }

    const existingIndex = dedupedItems.findIndex(
      (i) => getItemHash(i) === hash,
    );

    if (existingIndex === -1) {
      dedupedItems.push(item);
      continue;
    }

    // More categorized items take precedence, unless it's a generic interaction
    const existingItem = dedupedItems[existingIndex];
    const hasMatchingActivityType = existingItem.type === item.type;
    const isLocalUncategorized = existingItem.type === 'contractInteraction';

    if (!hasMatchingActivityType && !isLocalUncategorized) {
      continue;
    }

    dedupedItems[existingIndex] = item;
  }

  return dedupedItems.sort((a, b) => b.timestamp - a.timestamp);
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

/**
 * Finds the index of the last EVM item in the grouped items list
 * to determine when to trigger loading more items when scrolling
 *
 * @param groupedItems - Grouped items
 * @param evmItems - EVM items
 */
export function getLastEvmItemIndex(
  groupedItems: GroupedItem[],
  evmItems: ActivityListItem[],
) {
  const evmItemHashes = new Set(
    evmItems.flatMap((item) => {
      const hash = getItemHash(item);
      return hash ? [hash] : [];
    }),
  );

  for (let index = groupedItems.length - 1; index >= 0; index -= 1) {
    const row = groupedItems[index];
    const hash = row?.type === 'item' ? getItemHash(row.item) : undefined;

    if (hash && evmItemHashes.has(hash)) {
      return index;
    }
  }

  return -1;
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
