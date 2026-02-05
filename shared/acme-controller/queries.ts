import type { UseInfiniteQueryOptions } from '@tanstack/react-query';
import { fetchV4MultiAccountTransactions } from './api-client';
import type { V4MultiAccountTransactionsResponse } from './types';
import { assignCategories } from './business-logic';

// THIS can be in a shared package
export const queries = {
  transactions: (
    accountAddress: string,
  ): UseInfiniteQueryOptions<V4MultiAccountTransactionsResponse> => ({
    queryKey: ['multiaccount', 'transactions', accountAddress],
    queryFn: ({ pageParam }) =>
      fetchV4MultiAccountTransactions({
        accountAddresses: accountAddress ? [accountAddress] : [],
        cursor: pageParam,
      }),
    select: assignCategories,
    enabled: Boolean(accountAddress),
    getNextPageParam: ({ pageInfo }) =>
      pageInfo.hasNextPage ? pageInfo.endCursor : undefined,
  }),

  // More queries can be added here
};
