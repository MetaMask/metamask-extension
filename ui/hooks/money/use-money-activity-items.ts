import { useEffect, useMemo } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  accountsApiItem,
  onchainItem,
  type AccountsApiActivity,
  type MoneyActivityItem,
} from '../../pages/money/types/money-activity';
import {
  MoneyActivityFilter,
  type MoneyActivityBuckets,
} from '../../pages/money/utils/money-activity-filters';
import { useMoneyAccountTransactions } from './use-money-account-transactions';
import { useMoneyAccountApiActivity } from './use-money-account-api-activity';

const EMPTY_API_ACTIVITY: AccountsApiActivity[] = [];

export type UseMoneyActivityItemsResult = {
  items: MoneyActivityItem[];
  buckets: MoneyActivityBuckets;
  loadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  error: boolean;
  refetch: () => void;
  isSettling: boolean;
  moneyAddress: string | undefined;
  mockDataEnabled: boolean;
};

/**
 * Upper bound on pages the {@link UseMoneyActivityItemsOptions.fill}
 * auto-fill will pull.
 */
export const AUTO_FILL_MAX_PAGES = 10;

export type UseMoneyActivityItemsOptions = {
  fill?: {
    bucket: MoneyActivityFilter;
    count: number;
  };
};

function safeItems(
  items: MoneyActivityItem[],
  watermark: number,
): MoneyActivityItem[] {
  if (watermark === Number.NEGATIVE_INFINITY) {
    return items;
  }
  return items.filter((item) => item.time > watermark);
}

function onchainOnly(items: MoneyActivityItem[]): MoneyActivityItem[] {
  return items.filter((item) => item.kind === 'onchain');
}

/**
 * Merge local on-chain Money transactions with Accounts API activity into a
 * single source-tagged, time-descending list.
 *
 * @param onchainTransactions - Local TransactionController rows.
 * @param apiActivity - Parsed Accounts API settlements.
 * @returns Merged items, newest first, with id as a stable timestamp tiebreak.
 */
export function mergeMoneyActivity(
  onchainTransactions: TransactionMeta[],
  apiActivity: AccountsApiActivity[],
): MoneyActivityItem[] {
  const apiHashes = new Set(apiActivity.map((row) => row.hash.toLowerCase()));
  const onchain = onchainTransactions
    .filter((tx) => !(tx.hash && apiHashes.has(tx.hash.toLowerCase())))
    .map(onchainItem);
  return [...onchain, ...apiActivity.map(accountsApiItem)].sort(
    (left, right) => right.time - left.time || left.id.localeCompare(right.id),
  );
}

export function buildMergedMoneyActivityBuckets(
  onchain: {
    all: TransactionMeta[];
    deposits: TransactionMeta[];
    transfers: TransactionMeta[];
  },
  apiActivity: AccountsApiActivity[],
  watermark: number = Number.NEGATIVE_INFINITY,
): MoneyActivityBuckets {
  return {
    [MoneyActivityFilter.All]: safeItems(
      mergeMoneyActivity(onchain.all, apiActivity),
      watermark,
    ),
    [MoneyActivityFilter.Deposits]: onchainOnly(
      safeItems(mergeMoneyActivity(onchain.deposits, apiActivity), watermark),
    ),
    [MoneyActivityFilter.Transfers]: onchainOnly(
      safeItems(mergeMoneyActivity(onchain.transfers, apiActivity), watermark),
    ),
  };
}

/**
 * Assembles the Money activity list from local on-chain transactions and
 * Accounts API card activity, bucketed by filter tab.
 *
 * @param options - Optional auto-fill target for the Home preview or
 * full-list active tab.
 * @param options.fill
 * @returns Buckets, pagination controls, and settling/error state.
 */
export function useMoneyActivityItems({
  fill,
}: UseMoneyActivityItemsOptions = {}): UseMoneyActivityItemsResult {
  const {
    allTransactions,
    deposits,
    transfers,
    moneyAddress,
    mockDataEnabled,
  } = useMoneyAccountTransactions();
  const {
    activity,
    isLoading,
    watermark,
    hasMore,
    loadMore,
    isLoadingMore,
    pageCount,
    error,
    refetch,
  } = useMoneyAccountApiActivity();

  const apiActivity = mockDataEnabled ? EMPTY_API_ACTIVITY : activity;
  const effectiveWatermark = mockDataEnabled
    ? Number.NEGATIVE_INFINITY
    : watermark;

  const buckets = useMemo(
    () =>
      buildMergedMoneyActivityBuckets(
        { all: allTransactions, deposits, transfers },
        apiActivity,
        effectiveWatermark,
      ),
    [allTransactions, deposits, transfers, apiActivity, effectiveWatermark],
  );

  const fillCount = buckets[fill?.bucket ?? MoneyActivityFilter.All].length;
  // Keep paging past the screenful budget while the target bucket is still
  // empty: otherwise the watermark can hide older on-chain rows forever
  // after AUTO_FILL_MAX_PAGES of unrelated API history.
  const wantsMorePages =
    fill !== undefined &&
    !mockDataEnabled &&
    hasMore &&
    fillCount < fill.count &&
    (fillCount === 0 || pageCount < AUTO_FILL_MAX_PAGES);

  useEffect(() => {
    if (wantsMorePages && !isLoadingMore) {
      loadMore();
    }
  }, [wantsMorePages, isLoadingMore, loadMore]);

  const isSettling =
    !mockDataEnabled &&
    (isLoading || (fillCount === 0 && (wantsMorePages || isLoadingMore)));

  return {
    items: buckets[MoneyActivityFilter.All],
    buckets,
    loadMore,
    hasMore: hasMore && !mockDataEnabled,
    isLoadingMore: isLoadingMore && !mockDataEnabled,
    error: error && !mockDataEnabled,
    refetch,
    isSettling,
    moneyAddress,
    mockDataEnabled,
  };
}
