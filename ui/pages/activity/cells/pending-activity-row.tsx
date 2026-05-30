import React from 'react';
import { usePendingTransactionGasModal } from '../../../components/app/pending-transaction-action-buttons/pending-transaction-cancel-speed-up-provider';
import { TransactionListItemPendingActions } from '../../../components/app/transaction-list-item/transaction-list-item-pending-actions';
import type { ActivityRowProps } from '../types';
import {
  ActivityRowLayout,
  ActivityRowLayoutProps,
} from './activity-row-layout';

export function PendingActivityRow({
  data,
  ...props
}: Readonly<ActivityRowLayoutProps & ActivityRowProps>) {
  const transactionGroup =
    data.raw?.type === 'localTransaction' ? data.raw.data : undefined;
  const isEarliestNonce = data.isEarliestNonce ?? false;
  const { setEditGasMode, onGasModalMetaId } = usePendingTransactionGasModal();

  if (!transactionGroup) {
    return <ActivityRowLayout {...props} />;
  }

  return (
    <>
      <ActivityRowLayout {...props} />

      <TransactionListItemPendingActions
        transactionGroup={transactionGroup}
        isEarliestNonce={isEarliestNonce}
        setEditGasMode={setEditGasMode}
        onGasModalMetaId={onGasModalMetaId}
      />
    </>
  );
}
