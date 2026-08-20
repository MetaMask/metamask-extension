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
import { selectRampsSettlementHashes } from '../../selectors/rampsController';
import { activityMatchesAssetId, type ActivityListFilter } from './helpers';

export function useLocalTransactions(filters: ActivityListFilter) {
  const localItems = useSelector(selectLocalActivityItems);
  const localTransactionsByHash = useSelector(selectLocalTransactionsByHash);
  const rampSettlementHashes = useSelector(selectRampsSettlementHashes);
  const assetId = 'assetId' in filters ? filters.assetId : undefined;
  const networks = 'networks' in filters ? filters.networks : undefined;

  const filteredLocalItems = useMemo(() => {
    let items = localItems;

    if (assetId) {
      items = items.filter((item) => activityMatchesAssetId(item, assetId));
    } else if (networks?.length) {
      const selectedNetworks = new Set(networks);
      items = items.filter((item) => selectedNetworks.has(item.chainId));
    } else {
      return [];
    }

    if (rampSettlementHashes.size === 0) {
      return items;
    }

    return items.filter((item) => {
      const hash = item.hash?.toLowerCase();
      return !hash || !rampSettlementHashes.has(hash);
    });
  }, [assetId, localItems, networks, rampSettlementHashes]);

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
