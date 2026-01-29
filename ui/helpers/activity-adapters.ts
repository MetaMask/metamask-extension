import { TransactionForDisplay } from './types';

/**
 * Merges pending transactions (already transformed) with API transactions
 * Removes duplicates by hash
 *
 * @param pendingTxs
 * @param apiTxs
 */
export function mergeActivityTransactions(
  pendingTxs: TransactionForDisplay[],
  apiTxs: TransactionForDisplay[],
): TransactionForDisplay[] {
  // Remove any API transactions that match pending ones (by hash)
  const pendingHashes = new Set(
    pendingTxs.map((tx) => tx.hash).filter(Boolean),
  );

  const filteredApi = apiTxs.filter((tx) => !pendingHashes.has(tx.hash));

  // Pending first, then API transactions
  return [...pendingTxs, ...filteredApi];
}
