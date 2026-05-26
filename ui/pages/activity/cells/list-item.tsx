import React from 'react';
import { usePendingTransactionGasModal } from '../../../components/app/pending-transaction-action-buttons/pending-transaction-cancel-speed-up-provider';
import { TransactionListItemPendingActions } from '../../../components/app/transaction-list-item/transaction-list-item-pending-actions';
import { GenericActivityCell } from './generic-activity-cell';
import type { ActivityCellProps } from './types';

export function ListItem({
  data,
  earliestNonceByChain = {},
  onClick,
}: Readonly<ActivityCellProps>) {
  const transactionGroup =
    data.raw?.type === 'localTransaction' ? data.raw.data : undefined;
  const { setEditGasMode, onGasModalMetaId } = usePendingTransactionGasModal();

  if (!transactionGroup) {
    return (
      <GenericActivityCell
        data={data}
        onClick={onClick}
        earliestNonceByChain={earliestNonceByChain}
      />
    );
  }

  return (
    <>
      <GenericActivityCell
        data={data}
        onClick={onClick}
        earliestNonceByChain={earliestNonceByChain}
      />
      <TransactionListItemPendingActions
        transactionGroup={transactionGroup}
        earliestNonceByChain={earliestNonceByChain}
        setEditGasMode={setEditGasMode}
        onGasModalMetaId={onGasModalMetaId}
      />
    </>
  );
}
