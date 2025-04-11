import type {
  BatchTransactionParams,
  TransactionMeta,
} from '@metamask/transaction-controller';
import React from 'react';

import { ConfirmInfoRowText } from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoExpandableRow } from '../../../../../../../components/app/confirm/info/row/expandable-row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { Box } from '../../../../../../../components/component-library';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../../context/confirm';
import { useFourByte } from '../../hooks/useFourByte';
import { TransactionData } from '../../shared/transaction-data/transaction-data';
import { RecipientRow } from '../../shared/transaction-details/transaction-details';

export function NestedTransactionData() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { nestedTransactions } = currentConfirmation ?? {};

  if (!nestedTransactions?.length) {
    return null;
  }

  return (
    <Box data-testid="batch-txs">
      {nestedTransactions.map((nestedTransaction, index) => (
        <NestedTransaction
          key={index}
          index={index}
          nestedTransaction={nestedTransaction}
        />
      ))}
    </Box>
  );
}

function NestedTransaction({
  index,
  nestedTransaction,
}: {
  index: number;
  nestedTransaction: BatchTransactionParams;
}) {
  const t = useI18nContext();
  const { data, to } = nestedTransaction;
  const methodData = useFourByte({ data, to });

  const functionName = methodData?.name;

  const label =
    functionName ?? t('confirmNestedTransactionTitle', [String(index + 1)]);

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
