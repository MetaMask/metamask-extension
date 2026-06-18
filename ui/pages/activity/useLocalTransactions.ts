import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  isTransactionEarliestNonce,
  useEarliestNonceByChain,
} from '../../hooks/useEarliestNonceByChain';
import {
  selectLocalActivityItems,
  selectLocalTransactionsByHash,
} from '../../selectors/activity';
import { activityMatchesAssetId, type ActivityListFilter } from './helpers';

export function useLocalTransactions(filters: ActivityListFilter) {
  const localItems = useSelector(selectLocalActivityItems);
  const localTransactionsByHash = useSelector(selectLocalTransactionsByHash);
  const assetId = 'assetId' in filters ? filters.assetId : undefined;
  const networks = 'networks' in filters ? filters.networks : undefined;

  const filteredLocalItems = useMemo(() => {
    if (assetId) {
      return localItems.filter((item) => activityMatchesAssetId(item, assetId));
    }

    if (!networks?.length) {
      return [];
    }

    const selectedNetworks = new Set(networks);
    return localItems.filter((item) => selectedNetworks.has(item.chainId));
  }, [assetId, localItems, networks]);

  const localTransactionGroups = useMemo(
    () =>
      filteredLocalItems.flatMap((item) => {
        const hash = item.hash?.toLowerCase();
        const transactionGroup = hash
          ? localTransactionsByHash.get(hash)
          : undefined;

        return transactionGroup ? [transactionGroup] : [];
      }),
    [filteredLocalItems, localTransactionsByHash],
  );
  const earliestNonceByChain = useEarliestNonceByChain(localTransactionGroups);

  return useMemo(
    () =>
      filteredLocalItems.map((item) => {
        const hash = item.hash?.toLowerCase();
        const transactionGroup = hash
          ? localTransactionsByHash.get(hash)
          : undefined;

        if (!transactionGroup) {
          return item;
        }

        const { nonce, initialTransaction } = transactionGroup;

        return {
          ...item,
          isEarliestNonce: isTransactionEarliestNonce(
            nonce,
            initialTransaction?.chainId,
            earliestNonceByChain,
          ),
        };
      }),
    [earliestNonceByChain, filteredLocalItems, localTransactionsByHash],
  );
}
