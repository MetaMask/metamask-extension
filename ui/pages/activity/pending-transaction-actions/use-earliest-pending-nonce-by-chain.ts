import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { hexToDecimal } from '../../../../shared/lib/conversion.utils';
import { PENDING_STATUS_HASH } from '../../../helpers/constants/transactions';
import { selectTransactions } from '../../../selectors/transactionController';

/**
 * Lowest pending nonce per hex chainId from TransactionController state.
 */
export function useEarliestPendingNonceByChain(): Record<string, number> {
  const transactions = useSelector(selectTransactions);

  return useMemo(() => {
    const nonceMap: Record<string, number> = {};

    for (const transaction of transactions) {
      const { chainId, status, txParams } = transaction;
      const nonce = txParams?.nonce;

      if (
        !chainId ||
        !nonce ||
        !status ||
        !(status in PENDING_STATUS_HASH)
      ) {
        continue;
      }

      const nonceValue = Number(hexToDecimal(nonce));

      if (!(chainId in nonceMap) || nonceValue < nonceMap[chainId]) {
        nonceMap[chainId] = nonceValue;
      }
    }

    return nonceMap;
  }, [transactions]);
}

/**
 * Maps each pending local meta id to whether it has the earliest nonce on its chain.
 */
export function useIsEarliestNonceByMetaId(): Record<string, boolean> {
  const transactions = useSelector(selectTransactions);
  const earliestNonceByChain = useEarliestPendingNonceByChain();

  return useMemo(() => {
    const result: Record<string, boolean> = {};

    for (const transaction of transactions) {
      const { id, chainId, status, txParams } = transaction;
      const nonce = txParams?.nonce;

      if (
        !id ||
        !chainId ||
        !nonce ||
        !status ||
        !(status in PENDING_STATUS_HASH)
      ) {
        continue;
      }

      result[id] =
        Number(hexToDecimal(nonce)) === earliestNonceByChain[chainId];
    }

    return result;
  }, [transactions, earliestNonceByChain]);
}
