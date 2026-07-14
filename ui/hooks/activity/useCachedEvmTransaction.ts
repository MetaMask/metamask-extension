import { useMemo } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import type { V4MultiAccountTransactionsResponse } from '@metamask/core-backend';

export const activityQueryKey = [
  'accounts',
  'transactions',
  'v4MultiAccount',
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

    const numericChainId = Number(chainId.split(':')[1]);
    const normalizedHash = txHash.toLowerCase();
    const cachedQueries = queryClient.getQueriesData<
      InfiniteData<V4MultiAccountTransactionsResponse>
    >({
      queryKey: activityQueryKey,
    });

    for (const [, cachedData] of cachedQueries) {
      const transaction = cachedData?.pages
        .flatMap((page) => page.data)
        .find(
          (item) =>
            item.chainId === numericChainId &&
            item.hash.toLowerCase() === normalizedHash,
        );

      if (transaction) {
        return transaction;
      }
    }

    return undefined;
  }, [chainId, queryClient, txHash]);
}
