import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  isTransactionEarliestNonce,
  useEarliestNonceByChain,
} from '../../hooks/useEarliestNonceByChain';
import { selectLocalActivityItems } from '../../selectors/activity';

export function useLocalTransactions({ networks }: { networks: string[] }) {
  const localItems = useSelector(selectLocalActivityItems);

  const filteredLocalItems = useMemo(() => {
    if (networks.length === 0) {
      return [];
    }

    const selectedNetworks = new Set(networks);
    return localItems.filter((item) => selectedNetworks.has(item.chainId));
  }, [localItems, networks]);

  const localTransactionGroups = useMemo(
    () =>
      filteredLocalItems.flatMap((item) =>
        item.raw?.type === 'localTransaction' ? [item.raw.data] : [],
      ),
    [filteredLocalItems],
  );
  const earliestNonceByChain = useEarliestNonceByChain(localTransactionGroups);

  return useMemo(
    () =>
      filteredLocalItems.map((item) => {
        if (item.raw?.type !== 'localTransaction') {
          return item;
        }

        const { nonce, initialTransaction } = item.raw.data;

        return {
          ...item,
          isEarliestNonce: isTransactionEarliestNonce(
            nonce,
            initialTransaction?.chainId,
            earliestNonceByChain,
          ),
        };
      }),
    [earliestNonceByChain, filteredLocalItems],
  );
}
