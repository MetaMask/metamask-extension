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
    txParams?: {
      from?: string;
    };
  };
};

/**
 * Builds the earliest-nonce map key for a chain + sender pair. Nonce spaces are
 * per sender, so money-account and selected-account pending txs on the same
 * chain must not share a single earliest nonce.
 *
 * @param chainId - Chain ID.
 * @param from - Sender address.
 * @returns Normalized `chainId:from` key.
 */
export function getEarliestNonceKey(
  chainId: string,
  from: string | undefined,
): string {
  return `${chainId}:${(from ?? '').toLowerCase()}`;
}

/**
 * Calculates the earliest (lowest) pending nonce per chain and sender. Only
 * groups whose primaryTransaction has a pending status are considered;
 * confirmed locals that remain in the list for display are ignored.
 *
 * @param transactionGroups - Array of transaction groups (pending and non-pending)
 * @returns Map of `chainId:from` to earliest pending nonce value (as number)
 */
export function useEarliestNonceByChain(
  transactionGroups: TransactionGroup[],
): Record<string, number> {
  return useMemo(() => {
    const nonceMap: Record<string, number> = {};

    transactionGroups.forEach((txGroup) => {
      const { nonce, primaryTransaction } = txGroup;
      const chainId = txGroup.initialTransaction?.chainId;
      const from = txGroup.initialTransaction?.txParams?.from;

      if (
        !nonce ||
        !chainId ||
        !primaryTransaction?.status ||
        !(primaryTransaction.status in PENDING_STATUS_HASH)
      ) {
        return;
      }

      const nonceValue = Number(hexToDecimal(nonce));
      const key = getEarliestNonceKey(chainId, from);

      if (!(key in nonceMap) || nonceValue < nonceMap[key]) {
        nonceMap[key] = nonceValue;
      }
    });

    return nonceMap;
  }, [transactionGroups]);
}

/**
 * Checks if a transaction has the earliest pending nonce for its chain and
 * sender.
 *
 * @param nonce - Transaction nonce (hex string)
 * @param chainId - Chain ID
 * @param from - Sender address
 * @param earliestNonceByChainAndSender - Map of `chainId:from` to earliest nonce
 * @returns True if this transaction has the earliest nonce for its sender
 */
export function isTransactionEarliestNonce(
  nonce: string | undefined,
  chainId: string | undefined,
  from: string | undefined,
  earliestNonceByChainAndSender: Record<string, number>,
): boolean {
  if (!nonce || !chainId) {
    return false;
  }

  const nonceValue = Number(hexToDecimal(nonce));
  return (
    nonceValue ===
    earliestNonceByChainAndSender[getEarliestNonceKey(chainId, from)]
  );
}
