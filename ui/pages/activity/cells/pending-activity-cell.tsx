import React from 'react';
import { usePendingTransactionGasModal } from '../../../components/app/pending-transaction-action-buttons/pending-transaction-cancel-speed-up-provider';
import { TransactionListItemPendingActions } from '../../../components/app/transaction-list-item/transaction-list-item-pending-actions';
import { getActivityCellStatus } from '../helpers';
import { usePendingActivityCellPresentation } from '../usePendingActivityCellPresentation';
import { ActivityCellBase } from './activity-cell-base';
import type { ActivityCellProps } from '../types';

export function PendingActivityCell({
  data,
  onClick,
}: Readonly<ActivityCellProps>) {
  const cellStatus = getActivityCellStatus(data);
  const presentation = usePendingActivityCellPresentation(
    data,
    cellStatus.pendingSubtitleKey,
  );
  const transactionGroup =
    data.raw?.type === 'localTransaction' ? data.raw.data : undefined;
  const isEarliestNonce = data.isEarliestNonce ?? false;
  const { setEditGasMode, onGasModalMetaId } = usePendingTransactionGasModal();

  if (!transactionGroup) {
    return (
      <ActivityCellBase
        {...presentation}
        txStatus={cellStatus.txStatus}
        onClick={onClick}
      />
    );
  }

  return (
    <>
      <ActivityCellBase
        {...presentation}
        txStatus={cellStatus.txStatus}
        onClick={onClick}
      />
      <TransactionListItemPendingActions
        transactionGroup={transactionGroup}
        isEarliestNonce={isEarliestNonce}
        setEditGasMode={setEditGasMode}
        onGasModalMetaId={onGasModalMetaId}
      />
    </>
  );
}
