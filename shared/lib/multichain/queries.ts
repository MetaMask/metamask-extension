import type { UseInfiniteQueryOptions } from '@tanstack/react-query';
import { fetchV4MultiAccountTransactions, type Params } from '../api-client';
import type { NormalizedV4MultiAccountTransactionsResponse } from './types';
import {
  normalizeTransaction,
  filterTransactions,
  parseValueTransfers,
  mapTransactionToCategory,
} from './transformations';

export const transactionsQueryKey = ['multiaccount', 'transactions'];

export const queries = {
  transactions: (
    params: Params,
    options?: Partial<
      UseInfiniteQueryOptions<NormalizedV4MultiAccountTransactionsResponse>
    >,
  ): UseInfiniteQueryOptions<NormalizedV4MultiAccountTransactionsResponse> => {
    const accountAddress = params.accountAddresses[0] ?? '';

    return {
      queryKey: [...transactionsQueryKey, params],
      queryFn: async ({ pageParam }) => {
        const response = await fetchV4MultiAccountTransactions({
          ...params,
          cursor: pageParam,
        });

        // We should do this server-side
        const normalizedData = response.data.map((transaction) => ({
          ...normalizeTransaction(accountAddress, transaction),

          // The goal here is to return only usable information for the UI
          // @ts-expect-error Add missing readable field
          readable: transaction.readable,
          category: mapTransactionToCategory(transaction.transactionType),
          amounts: parseValueTransfers(accountAddress, transaction),
          transactionType: transaction.transactionType || '',
        }));

        return {
          unprocessedNetworks: response.unprocessedNetworks,
          pageInfo: response.pageInfo,
          data: normalizedData,
        };
      },
      select: filterTransactions(accountAddress), // We should do this server-side
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
