import React from 'react';
import { TransactionBatchApprovalData } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../context/confirm';
import {
  OriginRow,
  RecipientRow,
} from '../shared/transaction-details/transaction-details';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';

export function TransactionBatchInfo() {
  const { currentConfirmation: transactionBatch } =
    useConfirmContext<TransactionBatchApprovalData>();

  const recipientRows = transactionBatch.transactions.map(
    (transaction, index) => (
      <RecipientRow key={index} override={transaction.to} />
    ),
  );

  return (
    <>
      <ConfirmInfoSection style={{ marginTop: '10px' }}>
        <OriginRow />
        {recipientRows}
      </ConfirmInfoSection>
    </>
  );
}
