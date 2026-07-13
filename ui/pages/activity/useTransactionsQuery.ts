import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { HttpError } from '@metamask/core-backend';
import { parseCaipAssetType } from '@metamask/utils';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MINUTE } from '../../../shared/constants/time';
import { getErrorBodyMessage } from '../../../shared/lib/error';
import { getIntlLocale } from '../../ducks/locale/locale';
import { apiClient } from '../../helpers/api-client';
import { getUseExternalServices } from '../../selectors';
import { selectEvmAddress } from '../../selectors/activity';
import type { ActivityListFilter } from './helpers';
import { useQueryFilters } from './query-filters/useQueryFilters';

const knownApiMessages = ['networks param contains no supported chains'];
const maxEmptyFilteredPagesToSkip = 1;

type TransactionQueryOptions = ReturnType<
  typeof apiClient.accounts.getV4MultiAccountTransactionsInfiniteQueryOptions
>;
type TransactionQueryFunction = Extract<
  NonNullable<TransactionQueryOptions['queryFn']>,
  (...args: never[]) => unknown
>;

function isKnownApiResponseError(error: unknown) {
  if (!(error instanceof HttpError) || error.status !== 400) {
    return false;
  }

  const errorBodyMessage = getErrorBodyMessage(error.body);

  return Boolean(
    errorBodyMessage &&
    knownApiMessages.some((message) => errorBodyMessage.includes(message)),
  );
}

function withKnownApiResponse(queryFn: TransactionQueryOptions['queryFn']) {
  if (typeof queryFn !== 'function') {
    return queryFn;
  }

  return async (context: Parameters<TransactionQueryFunction>[0]) => {
    try {
      return await queryFn(context);
    } catch (error) {
      if (isKnownApiResponseError(error)) {
        return {
          data: [],
          pageInfo: {
            count: 0,
            hasNextPage: false,
          },
          unprocessedNetworks: [],
        };
      }

      throw error;
    }
  };
}

export function useTransactionsQuery(filters: ActivityListFilter) {
  const useExternalServices = useSelector(getUseExternalServices);
  const evmAddress = (useSelector(selectEvmAddress) || '').toLowerCase();
  const locale = useSelector(getIntlLocale);
  const selectFn = useQueryFilters({ subjectAddress: evmAddress, ...filters });
  const networks =
    'assetId' in filters
      ? [parseCaipAssetType(filters.assetId).chainId]
      : filters.networks;
  const evmNetworks = networks.filter((network) =>
    network.startsWith('eip155:'),
  );

  const accountAddresses = useMemo(
    () => (evmAddress ? [`eip155:0:${evmAddress}`] : []),
    [evmAddress],
  );

  const queryOptions =
    apiClient.accounts.getV4MultiAccountTransactionsInfiniteQueryOptions({
      accountAddresses,
      networks: evmNetworks,
      includeTxMetadata: true,
      lang: locale.split('-')[0],
    });

  const enabled =
    Boolean(useExternalServices) &&
    evmNetworks.length > 0 &&
    accountAddresses.length > 0;

  // Wrapped queryFn + select widen the options union enough that TS loses
  // getNextPageParam from FetchInfiniteQueryOptions.
  // @ts-expect-error Infinite query options from apiClient + local wrappers
  const query = useInfiniteQuery({
    ...queryOptions,
    queryFn: withKnownApiResponse(queryOptions.queryFn),
    initialPageParam: queryOptions.initialPageParam,
    select: selectFn,
    enabled,
    retry: false,
    placeholderData: enabled ? keepPreviousData : undefined,
    staleTime: 5 * MINUTE,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Client-side filters can result in empty pages, so skip a bounded number
  // until we find a non-empty page or reach the skip limit
  const fetchNextVisiblePage = useCallback(() => {
    if (!query.hasNextPage || query.isFetchingNextPage) {
      return;
    }

    async function fetchPages() {
      let visibleItemCount =
        query.data?.pages.flatMap((page) => page.data).length ?? 0;
      let pageCount = query.data?.pages.length ?? 0;
      let emptyFilteredPagesSkipped = 0;
      let result = await query.fetchNextPage();

      while (
        result.hasNextPage &&
        emptyFilteredPagesSkipped < maxEmptyFilteredPagesToSkip
      ) {
        const pages = result.data?.pages ?? [];
        const nextPageCount = pages.length;
        const nextVisibleItemCount = pages.flatMap((page) => page.data).length;

        if (
          nextVisibleItemCount > visibleItemCount ||
          nextPageCount <= pageCount
        ) {
          break;
        }

        emptyFilteredPagesSkipped += 1;
        visibleItemCount = nextVisibleItemCount;
        pageCount = nextPageCount;
        result = await query.fetchNextPage();
      }
    }

    fetchPages().catch(() => undefined);
  }, [
    query.data?.pages,
    query.fetchNextPage,
    query.hasNextPage,
    query.isFetchingNextPage,
  ]);

  return { ...query, fetchNextVisiblePage };
}
