import React from 'react';
import { usePendingTransactionGasModal } from '../../../components/app/pending-transaction-action-buttons/pending-transaction-cancel-speed-up-provider';
import { TransactionListItemPendingActions } from '../../../components/app/transaction-list-item/transaction-list-item-pending-actions';
import { ActivityCellBase, ActivityCellBaseProps } from './activity-cell-base';
import type { ActivityCellProps } from '../types';

export function PendingActivityCell({
  data,
  ...props
}: Readonly<ActivityCellBaseProps & ActivityCellProps>) {
  const transactionGroup =
    data.raw?.type === 'localTransaction' ? data.raw.data : undefined;
  const isEarliestNonce = data.isEarliestNonce ?? false;
  const { setEditGasMode, onGasModalMetaId } = usePendingTransactionGasModal();

  if (!transactionGroup) {
    return <ActivityCellBase {...props} />;
  }

  return (
    <>
      <ActivityCellBase {...props} />

      <TransactionListItemPendingActions
        transactionGroup={transactionGroup}
        isEarliestNonce={isEarliestNonce}
        setEditGasMode={setEditGasMode}
        onGasModalMetaId={onGasModalMetaId}
      />
    </>
  );
}
