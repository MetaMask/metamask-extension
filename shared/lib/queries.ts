import { InfiniteData, UseInfiniteQueryOptions } from '@tanstack/react-query';
import { isEqualCaseInsensitive } from '@metamask/controller-utils';
import { fetchV4MultiAccountTransactions } from './api-client';
import type { V4MultiAccountTransactionsResponse } from './types';

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
    enabled: Boolean(accountAddress),
    getNextPageParam: ({ pageInfo }) =>
      pageInfo.hasNextPage ? pageInfo.endCursor : undefined,
    select: filterTransactions(accountAddress),
  }),

  // More queries can be added here
};

// This is filtering that should be done server side
function filterTransactions(accountAddress: string) {
  return (data: InfiniteData<V4MultiAccountTransactionsResponse>) => {
    const result = {
      pages: data.pages.map((page) => {
        const filteredData = page.data.filter((tx) => {
          // Filter spam tokens
          if (tx.transactionType === 'SPAM_TOKEN_TRANSFER') {
            return false;
          }

          // Match Activity v1 behavior:

          // 1. Show user-initiated transactions (from === this account)
          const userInitiated =
            accountAddress && isEqualCaseInsensitive(tx.from, accountAddress);
          if (userInitiated) {
            return true;
          }

          // 2. Show incoming native token transfers
          if (tx.transactionType === 'INCOMING') {
            return true;
          }

          // 3. Show if transaction has value AND is sent === this account
          const hasValue = tx.value && tx.value !== '0' && tx.value !== '0x0';
          const isRecipient =
            accountAddress && isEqualCaseInsensitive(tx.to, accountAddress);
          if (hasValue && isRecipient) {
            return true;
          }

          return false;
        });

        return {
          ...page,
          data: filteredData,
        };
      }),
      pageParams: data.pageParams,
    };

    return result;
  };
}
