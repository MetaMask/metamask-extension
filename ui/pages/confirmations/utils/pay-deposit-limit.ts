import {
  hasTransactionType,
  type TransactionMeta,
  type TransactionType,
} from '@metamask/transaction-controller';

/**
 * Resolves the USD deposit limit for a transaction from a limits map, matching
 * the transaction type (including nested batch types).
 *
 * @param depositLimits - Per-transaction-type USD limits.
 * @param transactionMeta - The confirmation transaction metadata.
 * @returns The matching limit, or undefined when none applies.
 */
export function getDepositLimitForTransaction(
  depositLimits: Record<string, number>,
  transactionMeta?: TransactionMeta,
): number | undefined {
  for (const [type, limit] of Object.entries(depositLimits)) {
    if (hasTransactionType(transactionMeta, [type as TransactionType])) {
      return limit;
    }
  }

  return undefined;
}
