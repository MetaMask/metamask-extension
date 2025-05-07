import { NestedTransactionMetadata } from '@metamask/transaction-controller';

/**
 * Determines if a transaction is a batch transaction.
 *
 * @param nestedTransactions - An array of nested transaction.
 * @returns A boolean indicating whether the transaction is a batch transaction.
 */
export function isBatchTransaction(
  nestedTransactions: NestedTransactionMetadata[] | undefined,
): boolean {
  return Boolean(nestedTransactions?.length);
}
