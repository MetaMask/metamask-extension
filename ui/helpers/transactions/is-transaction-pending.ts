import type { TransactionMeta } from '@metamask/transaction-controller';
import { getStatusKey } from '../utils/transactions.util';
import { PENDING_STATUS_HASH } from '../constants/transactions';

/**
 * Whether a transaction meta is in a pending (in-flight) status for activity UI.
 *
 * @param transaction - Transaction meta (typically the group's primary transaction).
 */
export function isTransactionPending(transaction: TransactionMeta): boolean {
  const statusKey = getStatusKey(transaction);
  return statusKey in PENDING_STATUS_HASH;
}
