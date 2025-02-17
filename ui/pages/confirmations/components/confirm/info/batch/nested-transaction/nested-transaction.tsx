import React from 'react';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoExpandableRow } from '../../../../../../../components/app/confirm/info/row/expandable-row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { Box } from '../../../../../../../components/component-library';
import { RecipientRow } from '../../shared/transaction-details/transaction-details';
import { useConfirmContext } from '../../../../../context/confirm';
import { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionData } from '../../shared/transaction-data/transaction-data';
import { useFourByte } from '../../hooks/useFourByte';

export type NestedTransactionProps = {
  index: number;
};

export function NestedTransaction(props: NestedTransactionProps) {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { nestedTransactions } = currentConfirmation ?? {};
  const { data, to } = nestedTransactions?.[props.index] ?? {};
  const methodData = useFourByte({ data, to });

  if (!nestedTransactions) {
    return null;
  }

  const functionName = methodData?.name;
  const label = functionName ?? `Transaction ${props.index + 1}`;

  return (
    <ConfirmInfoSection>
      <ConfirmInfoExpandableRow
        label={label}
        content={
          <>
            {to && <RecipientRow recipient={to} />}
            {data && to && <TransactionData data={data} to={to} noPadding />}
          </>
        }
      >
        <ConfirmInfoRowText text="" />
      </ConfirmInfoExpandableRow>
    </ConfirmInfoSection>
  );
}
