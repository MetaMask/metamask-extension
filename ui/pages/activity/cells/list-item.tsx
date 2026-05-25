import React from 'react';
import { TransactionListItemPendingActions } from '../../../components/app/transaction-list-item/transaction-list-item-pending-actions';
import { GenericActivityCell } from './generic-activity-cell';
import type { ActivityCellProps } from './types';

export function ListItem({
  data,
  earliestNonceByChain = {},
  onClick,
}: ActivityCellProps) {
  const transactionGroup =
    data.raw?.type === 'localTransaction' ? data.raw.data : undefined;

  if (!transactionGroup) {
    return <GenericActivityCell data={data} onClick={onClick} />;
  }

  return (
    <>
      <GenericActivityCell data={data} onClick={onClick} />
      <TransactionListItemPendingActions
        transactionGroup={transactionGroup}
        earliestNonceByChain={earliestNonceByChain}
      />
    </>
  );
}
