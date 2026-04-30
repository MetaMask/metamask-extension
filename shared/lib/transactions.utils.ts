import {
  NestedTransactionMetadata,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';

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

/**
 * Checks if a transaction (including nested transactions) matches any of the given types.
 *
 * @param transactionMeta - The transaction metadata to check.
 * @param types - The transaction types to match against.
 * @returns Whether the transaction or any nested transaction matches one of the types.
 */
export function hasTransactionType(
  transactionMeta: TransactionMeta | undefined,
  types: TransactionType[],
) {
  const { nestedTransactions, type } = transactionMeta ?? {};

  if (types.includes(type as TransactionType)) {
    return true;
  }

  return (
    nestedTransactions?.some((tx) =>
      types.includes(tx.type as TransactionType),
    ) ?? false
  );
}

const PERPS_WITHDRAW_TYPES: TransactionType[] = [TransactionType.perpsWithdraw];

/**
 * Checks whether the given transaction is a Perps withdraw, either directly
 * via `type` or via any `nestedTransactions` entry.
 *
 * Mirrors `isTransactionPayWithdraw` from metamask-mobile and gives callers
 * a single place to reason about "is this a perps withdraw flow" instead of
 * sprinkling `hasTransactionType(tx, [TransactionType.perpsWithdraw])` and
 * ad-hoc `WITHDRAW_TYPES` lists across the codebase.
 *
 * @param transactionMeta - The transaction metadata to check.
 * @returns Whether the transaction (or any of its nested transactions) is a
 * Perps withdraw.
 */
export function isPerpsWithdrawTransaction(
  transactionMeta: TransactionMeta | undefined,
): boolean {
  return hasTransactionType(transactionMeta, PERPS_WITHDRAW_TYPES);
}
