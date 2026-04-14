import {
  TransactionStatus as KeyringTransactionStatus,
  type Transaction,
} from '@metamask/keyring-api';
import { TransactionStatus } from '@metamask/transaction-controller';
import { TransactionGroupStatus } from '../../../shared/constants/transaction';

export const NON_EVM_TRANSACTION_STATUS_KEY = {
  [KeyringTransactionStatus.Failed]: TransactionStatus.failed,
  [KeyringTransactionStatus.Confirmed]: TransactionStatus.confirmed,
  [KeyringTransactionStatus.Unconfirmed]: TransactionGroupStatus.pending,
  [KeyringTransactionStatus.Submitted]: TransactionStatus.submitted,
};

export function getNonEvmToastStatus(
  transaction: Transaction,
):
  | 'pending'
  | 'success'
  | 'failed'
  | null {
  const statusKey = NON_EVM_TRANSACTION_STATUS_KEY[transaction.status];

  if (
    statusKey === TransactionGroupStatus.pending ||
    statusKey === TransactionStatus.submitted
  ) {
    return 'pending';
  }

  if (statusKey === TransactionStatus.confirmed) {
    return 'success';
  }

  if (statusKey === TransactionStatus.failed) {
    return 'failed';
  }

  return null;
}
