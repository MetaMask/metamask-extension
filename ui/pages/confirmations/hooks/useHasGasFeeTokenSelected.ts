import { useMemo } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';

/**
 * Returns whether the given transaction has a gas fee token selected (user chose
 * another token to pay for gas). When true, Cancel and Speed up should be hidden.
 */
export function useHasGasFeeTokenSelected(
  transaction: TransactionMeta | undefined,
): boolean {
  return useMemo(
    () => Boolean(transaction?.selectedGasFeeToken),
    [transaction],
  );
}
