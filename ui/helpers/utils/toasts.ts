import { TransactionStatus } from '@metamask/transaction-controller';
import {
  TransactionStatus as KeyringTransactionStatus,
  type Transaction,
} from '@metamask/keyring-api';
import { TransactionGroupStatus } from '../../../shared/constants/transaction';

const keyringTransactionStatus = {
  [KeyringTransactionStatus.Failed]: TransactionStatus.failed,
  [KeyringTransactionStatus.Confirmed]: TransactionStatus.confirmed,
  [KeyringTransactionStatus.Unconfirmed]: TransactionGroupStatus.pending,
  [KeyringTransactionStatus.Submitted]: TransactionStatus.submitted,
};

export function getEvmTransactionToastId(transactionId: string) {
  return `tx-${transactionId}`;
}

export function getNonEvmTransactionToastId(transactionId: string) {
  return `non-evm-tx-${transactionId}`;
}

export function getBridgeTransactionToastId({
  approvalId,
  txId,
}: {
  approvalId: string;
  txId?: string;
}) {
  return txId ? getEvmTransactionToastId(txId) : `bridge-tx-${approvalId}`;
}

export function getNonEvmToastStatus(transaction: Transaction) {
  const status = keyringTransactionStatus[transaction.status];

  if (
    status === TransactionGroupStatus.pending ||
    status === TransactionStatus.submitted
  ) {
    return 'pending';
  }

  if (status === TransactionStatus.confirmed) {
    return 'success';
  }

  if (status === TransactionStatus.failed) {
    return 'failed';
  }

  return null;
}
