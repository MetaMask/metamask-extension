import type { UseInfiniteQueryOptions } from '@tanstack/react-query';
import type { V4MultiAccountTransactionsResponse } from '@metamask/core-backend';
import { STALE_TIMES } from '@metamask/core-backend';
import type { NormalizedV4MultiAccountTransactionsResponse } from '../../shared/lib/multichain/types';
import { apiClient } from './api-client';

type QueryOptions = Partial<
  UseInfiniteQueryOptions<
    V4MultiAccountTransactionsResponse,
    unknown,
    NormalizedV4MultiAccountTransactionsResponse
  >
>;

type Params = {
  accountAddresses: string[];
  evmAddress: string;
  networks: string[];
};

export const queries = {
  transactions: (
    params: Params,
    options?: QueryOptions,
  ): UseInfiniteQueryOptions<
    V4MultiAccountTransactionsResponse,
    unknown,
    NormalizedV4MultiAccountTransactionsResponse
  > => {
    const { accountAddresses, networks } = params;
    const queryParams = { networks, includeTxMetadata: true as const };

    const { queryKey } =
      apiClient.accounts.getV4MultiAccountTransactionsQueryOptions(
        accountAddresses,
        queryParams,
      );

    return {
      queryKey,
      queryFn: ({ pageParam, signal }) => {
        const { queryFn: fetchPage } =
          apiClient.accounts.getV4MultiAccountTransactionsQueryOptions(
            accountAddresses,
            { ...queryParams, cursor: pageParam },
          );
        return (
          fetchPage as (ctx: {
            signal?: AbortSignal;
          }) => Promise<V4MultiAccountTransactionsResponse>
        )({ signal });
      },
      getNextPageParam: ({ pageInfo }) =>
        pageInfo.hasNextPage ? pageInfo.endCursor : undefined,
      staleTime: STALE_TIMES.TRANSACTIONS,
      ...options,
      enabled: Boolean(accountAddresses[0]) && (options?.enabled ?? true),
    };
  },
};
