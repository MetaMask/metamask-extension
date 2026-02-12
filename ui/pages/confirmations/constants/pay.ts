import { TransactionType } from '@metamask/transaction-controller';

/**
 * Transaction types that use the Pay flow (TransactionDetailsModal instead of TransactionListItemDetails)
 */
export const PAY_TRANSACTION_TYPES = [
  TransactionType.musdConversion,
  TransactionType.perpsDeposit,
];
