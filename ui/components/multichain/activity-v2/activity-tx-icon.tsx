import React from 'react';
import { TransactionStatus } from '@metamask/transaction-controller';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';
import TransactionIcon from '../../app/transaction-icon/transaction-icon';
import type { TransactionViewModel } from '../../../../shared/lib/multichain/types';

function getIconCategory(tx: TransactionViewModel) {
  const { transactionCategory } = tx;

  if (transactionCategory === 'APPROVE') {
    return TransactionGroupCategory.approval;
  }

  if (
    transactionCategory === 'BRIDGE_OUT' ||
    transactionCategory === 'BRIDGE_IN'
  ) {
    return TransactionGroupCategory.bridge;
  }

  if (transactionCategory === 'SWAP' || transactionCategory === 'EXCHANGE') {
    return TransactionGroupCategory.swap;
  }

  if (transactionCategory === 'TRANSFER') {
    if (tx.amounts?.to && !tx.amounts?.from) {
      return TransactionGroupCategory.receive;
    }
    if (tx.amounts?.from) {
      return TransactionGroupCategory.send;
    }
  }

  return TransactionGroupCategory.interaction;
}

export const ActivityTxIcon = ({
  transaction,
}: {
  transaction: TransactionViewModel;
}) => {
  const category = getIconCategory(transaction);
  const status =
    transaction.status === TransactionStatus.failed
      ? TransactionStatus.failed
      : TransactionStatus.confirmed;

  return <TransactionIcon category={category} status={status} />;
};
