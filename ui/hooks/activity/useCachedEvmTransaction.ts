import { useMemo } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import type { V5MultiAccountTransactionsResponse } from '@metamask/core-backend';

export const activityQueryKey = [
  'accounts',
  'transactions',
  'v5MultiAccount',
] as const;

export function useCachedEvmTransaction({
  chainId,
  txHash,
}: {
  chainId: string | undefined;
  txHash: string | undefined;
}) {
  const queryClient = useQueryClient();

  return useMemo(() => {
    if (!chainId?.startsWith('eip155:') || !txHash) {
      return undefined;
    }

    const normalizedHash = txHash.toLowerCase();
    const cachedQueries = queryClient.getQueriesData<
      InfiniteData<V5MultiAccountTransactionsResponse>
    >({
      queryKey: activityQueryKey,
    });

    for (const [, cachedData] of cachedQueries) {
      const transaction = cachedData?.pages
        .flatMap((page) => page.data)
        .find(
          (item) =>
            item.tx.chainId === chainId &&
            item.tx.id.toLowerCase() === normalizedHash,
        );

      if (transaction) {
        return transaction;
      }
    }

    return undefined;
  }, [chainId, queryClient, txHash]);
}
