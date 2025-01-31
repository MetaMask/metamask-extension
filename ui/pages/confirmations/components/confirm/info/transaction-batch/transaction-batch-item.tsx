import React from 'react';
import { NestedTransactionParams } from '@metamask/transaction-controller';
import { RecipientRow } from '../shared/transaction-details/transaction-details';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { TransactionData } from '../shared/transaction-data/transaction-data';
import { Hex } from '@metamask/utils';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
  ConfirmInfoRowTextTokenUnits,
} from '../../../../../../components/app/confirm/info/row';

export function NestedTransactions({
  nestedTransactions,
}: {
  nestedTransactions?: NestedTransactionParams[];
}) {
  if (!nestedTransactions) {
    return null;
  }

  const items = nestedTransactions.map((transaction, index) => (
    <TransactionBatchItem key={index} item={transaction} index={index} />
  ));

  return <>{items}</>;
}

function TransactionBatchItem({
  index,
  item,
}: {
  index: number;
  item: NestedTransactionParams;
}) {
  return (
    <ConfirmInfoSection>
      <ConfirmInfoRow label="Transaction">
        <ConfirmInfoRowText text={`#${index + 1}`} />
      </ConfirmInfoRow>
      <RecipientRow override={item.to} />
      <ConfirmInfoRow label="Value">
        <ConfirmInfoRowTextTokenUnits
          value={item.value as string}
          decimals={18}
        />
      </ConfirmInfoRow>
      <TransactionData
        transactionData={item.data as Hex}
        transactionTo={item.to as Hex}
        noPadding
      />
    </ConfirmInfoSection>
  );
}
