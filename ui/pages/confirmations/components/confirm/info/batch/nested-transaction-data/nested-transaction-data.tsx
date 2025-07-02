import React from 'react';
import {
  BatchTransactionParams,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../../context/confirm';
import { Box } from '../../../../../../../components/component-library';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { ConfirmInfoExpandableRow } from '../../../../../../../components/app/confirm/info/row/expandable-row';
import { RecipientRow } from '../../shared/transaction-details/transaction-details';
import { TransactionData } from '../../shared/transaction-data/transaction-data';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoRowCurrency } from '../../../../../../../components/app/confirm/info/row/currency';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useNestedTransactionLabels } from '../../hooks/useNestedTransactionLabels';

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
  const { data, to, value } = nestedTransaction;

  const label = useNestedTransactionLabels({
    nestedTransactions: [nestedTransaction],
    useIndex: index,
  })[0];

  return (
    <ConfirmInfoSection>
      <ConfirmInfoExpandableRow
        label={label}
        content={
          <>
            {to && <RecipientRow recipient={to} />}
            {value && (
              <ConfirmInfoRow label={t('amount')}>
                <ConfirmInfoRowCurrency value={value} />
              </ConfirmInfoRow>
            )}
            {data && to && (
              <TransactionData
                data={data}
                to={to}
                noPadding
                nestedTransactionIndex={index}
              />
            )}
          </>
        }
      >
        <ConfirmInfoRowText text="" />
      </ConfirmInfoExpandableRow>
    </ConfirmInfoSection>
  );
}
