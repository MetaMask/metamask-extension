import { useMemo } from 'react';
import { hexToDecimal } from '../../shared/modules/conversion.utils';

type TransactionGroup = {
  nonce?: string;
  initialTransaction?: {
    chainId?: string;
  };
};

/**
 * Calculates the earliest (lowest) nonce per chain for pending transactions.
 * Used to determine which transaction can be sped up (must process in nonce order).
 *
 * @param transactionGroups - Array of pending transaction groups
 * @returns Map of chainId to earliest nonce value (as number)
 */
export function useEarliestNonceByChain(
  transactionGroups: TransactionGroup[],
): Record<string, number> {
  return useMemo(() => {
    const nonceMap: Record<string, number> = {};

    transactionGroups.forEach((txGroup) => {
      const { nonce } = txGroup;
      const chainId = txGroup.initialTransaction?.chainId;

      if (nonce && chainId) {
        const nonceValue = Number(hexToDecimal(nonce));

        if (!(chainId in nonceMap) || nonceValue < nonceMap[chainId]) {
          nonceMap[chainId] = nonceValue;
        }
      }
    });

    return nonceMap;
  }, [transactionGroups]);
}

/**
 * Checks if a transaction has the earliest nonce for its chain.
 *
 * @param nonce - Transaction nonce (hex string)
 * @param chainId - Chain ID
 * @param earliestNonceByChain - Map of chainId to earliest nonce
 * @returns True if this transaction has the earliest nonce
 */
export function isTransactionEarliestNonce(
  nonce: string | undefined,
  chainId: string | undefined,
  earliestNonceByChain: Record<string, number>,
): boolean {
  if (!nonce || !chainId) {
    return false;
  }

  const nonceValue = Number(hexToDecimal(nonce));
  return nonceValue === earliestNonceByChain[chainId];
}
