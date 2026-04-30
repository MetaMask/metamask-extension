import { useMemo } from 'react';
import { hexToDecimal } from '../../shared/lib/conversion.utils';
import { PENDING_STATUS_HASH } from '../helpers/constants/transactions';

type TransactionGroup = {
  nonce?: string;
  primaryTransaction?: {
    status?: string;
  };
  initialTransaction?: {
    chainId?: string;
  };
};

/**
 * Calculates the earliest (lowest) nonce per chain for pending transactions.
 * Only groups whose primaryTransaction has a pending status are considered;
 * confirmed locals that remain in the list for display are ignored.
 *
 * @param transactionGroups - Array of transaction groups (pending and non-pending)
 * @returns Map of chainId to earliest pending nonce value (as number)
 */
export function useEarliestNonceByChain(
  transactionGroups: TransactionGroup[],
): Record<string, number> {
  return useMemo(() => {
    const nonceMap: Record<string, number> = {};

    transactionGroups.forEach((txGroup) => {
      const { nonce, primaryTransaction } = txGroup;
      const chainId = txGroup.initialTransaction?.chainId;

      if (
        !nonce ||
        !chainId ||
        !primaryTransaction?.status ||
        !(primaryTransaction.status in PENDING_STATUS_HASH)
      ) {
        return;
      }

      const nonceValue = Number(hexToDecimal(nonce));

      if (!(chainId in nonceMap) || nonceValue < nonceMap[chainId]) {
        nonceMap[chainId] = nonceValue;
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
