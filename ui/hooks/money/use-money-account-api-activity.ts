import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useInfiniteQuery } from '@tanstack/react-query';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { MUSD_MONEY_ACCOUNT_CHAIN_IDS } from '@metamask/money-account-utils';
import type { V1AccountTransactionsResponse } from '@metamask/core-backend';
import { apiClient } from '../../helpers/api-client';
import { MINUTE } from '../../../shared/constants/time';
import { selectMoneyActivityMockDataEnabled } from '../../selectors/money/money-account-feature-flags';
import type { AccountsApiActivity } from '../../pages/money/types/money-activity';
import {
  DEFAULT_MONEY_CARD_ACTIVITY_CASHBACK_MULTISEND_CONTRACTS,
  oldestRawActivityTime,
  parseAccountsApiActivity,
} from '../../pages/money/utils/accounts-api';
import { useMoneyAccountInfo } from './useMoneyAccountInfo';

export type UseMoneyAccountApiActivityResult = {
  activity: AccountsApiActivity[];
  /**
   * Pagination watermark in epoch ms. Merged activity older than this may
   * have un-fetched API rows that belong above it. Once paging is complete
   * this is `Number.NEGATIVE_INFINITY`.
   */
  watermark: number;
  pageCount: number;
  hasMore: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;
  isLoading: boolean;
  error: boolean;
  refetch: () => void;
};

const EMPTY_ACTIVITY: AccountsApiActivity[] = [];
const EMPTY_PAGES: V1AccountTransactionsResponse[] = [];

const ACCOUNT_ACTIVITY_QUERY_OPTIONS = {
  chainIds: MUSD_MONEY_ACCOUNT_CHAIN_IDS,
  sortDirection: 'DESC' as const,
};

/**
 * Off-device MetaMask Card activity (spends, cashback, refunds) for the
 * Money Account, sourced from the Accounts API.
 *
 * @returns Parsed activity, pagination controls, and query status.
 */
export function useMoneyAccountApiActivity(): UseMoneyAccountApiActivityResult {
  const { primaryMoneyAccount } = useMoneyAccountInfo();
  const mockDataEnabled = useSelector(selectMoneyActivityMockDataEnabled);
  const rawAddress = primaryMoneyAccount?.address;
  const moneyAddress = rawAddress ? toChecksumHexAddress(rawAddress) : '';
  const enabled = moneyAddress !== '' && !mockDataEnabled;

  const queryOptions = apiClient.accounts.getV1AccountTransactionsQueryOptions(
    moneyAddress,
    ACCOUNT_ACTIVITY_QUERY_OPTIONS,
  );

  const query = useInfiniteQuery({
    queryKey: queryOptions.queryKey,
    initialPageParam: undefined as string | undefined,
    // Call the SDK HTTP `queryFn` directly. `fetchV1AccountTransactions`
    // wraps the same options in `queryClient.fetchQuery`, whose key hashes
    // identically to this infinite query on page 1 (`cursor: undefined` is
    // dropped by JSON.stringify). That makes the first page wait on itself.
    queryFn: async ({
      pageParam,
      signal,
    }: {
      pageParam?: string;
      signal?: AbortSignal;
    }) => {
      const { queryFn: fetchPage } =
        apiClient.accounts.getV1AccountTransactionsQueryOptions(moneyAddress, {
          ...ACCOUNT_ACTIVITY_QUERY_OPTIONS,
          cursor: pageParam,
        });
      if (typeof fetchPage !== 'function') {
        throw new Error('Accounts API query function is missing');
      }
      return fetchPage({ signal } as Parameters<typeof fetchPage>[0]);
    },
    getNextPageParam: (lastPage: V1AccountTransactionsResponse) =>
      lastPage.pageInfo?.hasNextPage && lastPage.pageInfo.cursor
        ? lastPage.pageInfo.cursor
        : undefined,
    enabled,
    staleTime: 5 * MINUTE,
    retry: false,
  });

  const pages = query.data?.pages ?? EMPTY_PAGES;

  const activity = useMemo(() => {
    if (pages.length === 0) {
      return EMPTY_ACTIVITY;
    }
    const seen = new Set<string>();
    return pages
      .flatMap((page) =>
        parseAccountsApiActivity(
          page,
          moneyAddress,
          DEFAULT_MONEY_CARD_ACTIVITY_CASHBACK_MULTISEND_CONTRACTS,
        ),
      )
      .filter((row) => {
        const key = `${row.kind}:${row.hash.toLowerCase()}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
  }, [pages, moneyAddress]);

  // `hasNextPage` is `false` before any page has loaded, so it only means
  // "paging finished" once data exists.
  const isComplete =
    !enabled ||
    query.isError ||
    (query.data !== undefined && !query.hasNextPage);

  const watermark = useMemo(() => {
    if (isComplete) {
      return Number.NEGATIVE_INFINITY;
    }
    const oldest = oldestRawActivityTime(pages);
    // Pages arrived but none had parseable timestamps — do not freeze the
    // merged list behind +Infinity (`time > Infinity` is never true).
    if (pages.length > 0 && oldest === Number.POSITIVE_INFINITY) {
      return Number.NEGATIVE_INFINITY;
    }
    return oldest;
  }, [pages, isComplete]);

  const { hasNextPage, isFetchingNextPage, fetchNextPage, isError } = query;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isError) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isError]);

  return {
    activity,
    watermark,
    pageCount: pages.length,
    hasMore: hasNextPage === true && !isError,
    loadMore,
    isLoadingMore: isFetchingNextPage,
    isLoading: query.isLoading,
    error: query.isError,
    refetch: query.refetch,
  };
}
