import { NestedTransactionMetadata } from '@metamask/transaction-controller';

/**
 * Determines if a transaction is a batch transaction.
 *
 * @param from - The address initiating the transaction.
 * @param nestedTransactions - An array of nested transaction.
 * @param to - The recipient address of the transaction.
 * @returns A boolean indicating whether the transaction is a batch transaction.
 */
export function isBatchTransaction(
  from: string,
  nestedTransactions: NestedTransactionMetadata[] | undefined,
  to: string | undefined,
): boolean {
  return (
    Boolean(nestedTransactions?.length) &&
    to?.toLowerCase() === from.toLowerCase()
  );
}
