import type { V5TransactionRecord } from '@metamask/core-backend';

export function isExcludedTransactionHash(
  transaction: V5TransactionRecord,
  txHashes: Set<string>,
) {
  return Boolean(
    transaction.tx.id && txHashes.has(transaction.tx.id.toLowerCase()),
  );
}
