import type { UseInfiniteQueryOptions } from '@tanstack/react-query';
import type { V4MultiAccountTransactionsResponse } from '@metamask/core-backend';
import { fetchV4MultiAccountTransactions, type Params } from '../api-client';
import type { NormalizedV4MultiAccountTransactionsResponse } from './types';
import { selectTransactions } from './transformations';

export const transactionsQueryKey = ['multiaccount', 'transactions'];

type TransactionsReactQueryOptions = Partial<
  UseInfiniteQueryOptions<
    V4MultiAccountTransactionsResponse,
    unknown,
    NormalizedV4MultiAccountTransactionsResponse
  >
>;

type TransactionsQueryConfig = {
  params: Params;
  options?: TransactionsReactQueryOptions;
  getBearerToken?: () => Promise<string | undefined>;
};

export const queries = {
  transactions: ({
    params,
    options,
    getBearerToken,
  }: TransactionsQueryConfig): UseInfiniteQueryOptions<
    V4MultiAccountTransactionsResponse,
    unknown,
    NormalizedV4MultiAccountTransactionsResponse
  > => {
    const accountAddress = params.accountAddresses[0] ?? '';

    return {
      queryKey: [...transactionsQueryKey, params],
      queryFn: async ({ pageParam, signal }) => {
        const bearerToken = await getBearerToken?.();
        return fetchV4MultiAccountTransactions(
          {
            ...params,
            cursor: pageParam,
          },
          {
            bearerToken,
            signal,
          },
        );
      },
      select: selectTransactions(accountAddress),
      getNextPageParam: ({ pageInfo }) =>
        pageInfo.hasNextPage ? pageInfo.endCursor : undefined,
      refetchOnWindowFocus: false,
      refetchInterval: 15 * 1000,
      staleTime: 15 * 1000,
      ...options,
      enabled: Boolean(accountAddress) && (options?.enabled ?? true),
    };
  },
};
