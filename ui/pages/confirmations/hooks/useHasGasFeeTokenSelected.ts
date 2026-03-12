import type { TransactionMeta } from '@metamask/transaction-controller';

/**
 * Returns whether the given transaction has a gas fee token selected (user chose
 * another token to pay for gas).
 * @param transaction - The transaction to check for a selected gas fee token.
 * @returns `true` if the transaction has a selected gas fee token, otherwise
 * `false`.
 */
export function useHasGasFeeTokenSelected(
  transaction: TransactionMeta | undefined,
): boolean {
  return Boolean(transaction?.selectedGasFeeToken);
}
