import React, { useMemo } from 'react';
import { Text } from '../../../../../components/component-library';
import { TextVariant } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';
import { TransactionDetailsRow } from '../transaction-details-row';
import { useTransactionDetails } from '../transaction-details-context';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TransactionDetailsTotalRow() {
  const t = useI18nContext();
  const { transactionMeta } = useTransactionDetails();
  const fiatFormatter = useFiatFormatter();

  const { metamaskPay } = transactionMeta;
  const { totalFiat: payTotal } = metamaskPay || {};

  const totalFormatted = useMemo(() => {
    if (!payTotal) {
      return null;
    }
    return fiatFormatter(Number(payTotal));
  }, [fiatFormatter, payTotal]);

  return (
    <TransactionDetailsRow
      label={t('total')}
      data-testid="transaction-details-total-row"
    >
      <Text variant={TextVariant.bodyMd}>{totalFormatted ?? '-'}</Text>
    </TransactionDetailsRow>
  );
}
