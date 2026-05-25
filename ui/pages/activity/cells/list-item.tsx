import React from 'react';
import TransactionListItem from '../../../components/app/transaction-list-item';
import { GenericActivityCell } from './generic-activity-cell';
import type { ActivityCellProps } from './types';

export function ListItem({ data, onClick }: ActivityCellProps) {
  const transactionGroup =
    data.raw?.type === 'localTransaction' ? data.raw.data : undefined;
  const shouldUseLegacyPendingControls =
    transactionGroup &&
    (data.status === 'pending' ||
      transactionGroup.hasCancelled ||
      transactionGroup.hasRetried);

  if (shouldUseLegacyPendingControls) {
    let transactionStatus = data.status;
    if (transactionGroup.hasCancelled) {
      transactionStatus = 'cancelled';
    } else if (data.status === 'success') {
      transactionStatus = 'confirmed';
    }

    return (
      <div data-tx-status={transactionStatus}>
        <TransactionListItem
          transactionGroup={transactionGroup}
          isEarliestNonce
          chainId={transactionGroup.initialTransaction.chainId}
        />
      </div>
    );
  }

  return <GenericActivityCell data={data} onClick={onClick} />;
}
