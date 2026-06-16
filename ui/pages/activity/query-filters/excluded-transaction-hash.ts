import type { V1TransactionByHashResponse } from '@metamask/core-backend';

export function isExcludedTransactionHash(
  transaction: V1TransactionByHashResponse,
  txHashes: Set<string>,
) {
  return Boolean(
    transaction.hash && txHashes.has(transaction.hash.toLowerCase()),
  );
}
