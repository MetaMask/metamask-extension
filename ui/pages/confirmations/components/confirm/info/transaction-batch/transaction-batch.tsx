import React from 'react';
import { TransactionBatchApprovalData } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../context/confirm';
import { OriginRow } from '../shared/transaction-details/transaction-details';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { NestedTransactions } from './transaction-batch-item';

export function TransactionBatchInfo() {
  const { currentConfirmation: transactionBatch } =
    useConfirmContext<TransactionBatchApprovalData>();

  const { transactions } = transactionBatch;

  return (
    <>
      <ConfirmInfoSection style={{ marginTop: '10px' }}>
        <OriginRow />
      </ConfirmInfoSection>
      <NestedTransactions nestedTransactions={transactions} />
    </>
  );
}
