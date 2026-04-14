import type { Transaction } from '@metamask/keyring-api';
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { TransactionStatus as KeyringTransactionStatus } from '@metamask/keyring-api';
import { TransactionGroupStatus } from '../../../shared/constants/transaction';
import { EventPayloadArg } from './shared';

const keyringTransactionStatus = {
  [KeyringTransactionStatus.Failed]: TransactionStatus.failed,
  [KeyringTransactionStatus.Confirmed]: TransactionStatus.confirmed,
  [KeyringTransactionStatus.Unconfirmed]: TransactionGroupStatus.pending,
  [KeyringTransactionStatus.Submitted]: TransactionStatus.submitted,
};

export function getEvmTransactionToastId(id: string) {
  return `tx-${id}`;
}

export function getNonEvmTransactionToastId(id: string) {
  return `non-evm-tx-${id}`;
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

export function mapNonEvmToastStatus(transaction: Transaction) {
  const txStatus = keyringTransactionStatus[transaction.status];

  if (
    txStatus === TransactionGroupStatus.pending ||
    txStatus === TransactionStatus.submitted
  ) {
    return 'pending';
  }

  if (txStatus === TransactionStatus.confirmed) {
    return 'success';
  }

  if (txStatus === TransactionStatus.failed) {
    return 'failed';
  }

  return null;
}

export function extractTransactionFromEvent(args: unknown[]) {
  const firstArg = args?.[0] as EventPayloadArg | undefined;
  if (!firstArg || typeof firstArg !== 'object') {
    return null;
  }

  if ('transactionMeta' in firstArg) {
    return firstArg.transactionMeta ?? null;
  }

  return firstArg as TransactionMeta;
}

export function extractTransactionsFromEvent(args: unknown[]): Transaction[] {
  const firstArg = args?.[0] as
    | { transactions?: Record<string, Transaction[]> }
    | undefined;

  if (!firstArg?.transactions) {
    return [];
  }

  return Object.values(firstArg.transactions).flat();
}
