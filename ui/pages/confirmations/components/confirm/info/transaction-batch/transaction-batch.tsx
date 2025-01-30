import React from 'react';
import { TransactionBatchApprovalData } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../context/confirm';
import {
  OriginRow,
  RecipientRow,
} from '../shared/transaction-details/transaction-details';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { TransactionData } from '../shared/transaction-data/transaction-data';
import { Hex } from '@metamask/utils';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../../components/app/confirm/info/row';

function TransactionBatchItem({
  index,
  item,
}: {
  index: number;
  item: TransactionBatchApprovalData['transactions'][0];
}) {
  const { currentConfirmation } =
    useConfirmContext<TransactionBatchApprovalData>();

  const { chainId } = currentConfirmation;

  return (
    <ConfirmInfoSection>
      <ConfirmInfoRow label="Transaction">
        <ConfirmInfoRowText text={`#${index + 1}`} />
      </ConfirmInfoRow>
      <RecipientRow override={item.to} />
      <TransactionData
        chainIdOverride={chainId}
        dataOverride={item.data as Hex}
        noPadding
        toOverride={item.to as Hex}
      />
    </ConfirmInfoSection>
  );
}

export function TransactionBatchInfo() {
  const { currentConfirmation: transactionBatch } =
    useConfirmContext<TransactionBatchApprovalData>();

  const itemRows = transactionBatch.transactions.map((transaction, index) => (
    <TransactionBatchItem key={index} item={transaction} index={index} />
  ));

  return (
    <>
      <ConfirmInfoSection style={{ marginTop: '10px' }}>
        <OriginRow />
      </ConfirmInfoSection>
      {itemRows}
    </>
  );
}
