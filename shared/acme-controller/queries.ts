import type { UseInfiniteQueryOptions } from '@tanstack/react-query';
import { fetchV4MultiAccountTransactions } from './api-client';
import type { NormalizedGetAccountTransactionsResponse } from './types';
import {
  normalizeTransaction,
  filterTransactions,
  getTransferAmounts,
  mapTransactionToCategory,
} from './transformations';

export const queries = {
  transactions: (
    accountAddress: string,
  ): UseInfiniteQueryOptions<NormalizedGetAccountTransactionsResponse> => ({
    queryKey: ['multiaccount', 'transactions', accountAddress],
    queryFn: async ({ pageParam }) => {
      const response = await fetchV4MultiAccountTransactions({
        accountAddresses: accountAddress ? [accountAddress] : [],
        cursor: pageParam,
      });

      // We should do this server-side
      const normalizedData = await Promise.all(
        response.data.map(async (transaction) => ({
          // Ported over
          ...(await normalizeTransaction(accountAddress, transaction)),

          // Goal is to return only usable information for the UI
          readable: transaction.readable,
          category: mapTransactionToCategory(transaction.transactionType),
          amounts: getTransferAmounts(accountAddress, transaction),
          transactionType: transaction.transactionType,
        })),
      );

      return {
        unprocessedNetworks: response.unprocessedNetworks,
        pageInfo: response.pageInfo,
        data: normalizedData,
      };
    },
    select: filterTransactions, // We should do this server-side
    enabled: Boolean(accountAddress),
    getNextPageParam: ({ pageInfo }) =>
      pageInfo.hasNextPage ? pageInfo.endCursor : undefined,
  }),

  // More queries can be added here
};
