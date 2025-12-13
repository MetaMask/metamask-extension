import {
  type TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { createDeepEqualSelector } from './selector-creators';

// re-export for backward compatibility
export { createDeepEqualSelector };

export const filterAndShapeUnapprovedTransactions = (
  transactions: TransactionMeta[],
) => {
  return transactions
    .filter(({ status }) => status === TransactionStatus.unapproved)
    .reduce<Record<string, TransactionMeta>>((result, transaction) => {
      result[transaction.id] = transaction;
      return result;
    }, {});
};
