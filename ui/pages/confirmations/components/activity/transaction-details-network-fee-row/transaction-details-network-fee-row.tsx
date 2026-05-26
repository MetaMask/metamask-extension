import React, { useMemo } from 'react';
import { Text } from '../../../../../components/component-library';
import { TextVariant } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';
import { TransactionDetailsRow } from '../transaction-details-row';
import { useTransactionDetails } from '../transaction-details-context';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TransactionDetailsNetworkFeeRow() {
  const t = useI18nContext();
  const { transactionMeta } = useTransactionDetails();
  const fiatFormatter = useFiatFormatter();

  const { metamaskPay } = transactionMeta;
  const { networkFeeFiat: payNetworkFeeFiat } = metamaskPay || {};

  const networkFeeFormatted = useMemo(() => {
    if (!payNetworkFeeFiat) {
      return null;
    }
    return fiatFormatter(Number(payNetworkFeeFiat));
  }, [fiatFormatter, payNetworkFeeFiat]);

  return (
    <TransactionDetailsRow
      label={t('networkFee')}
      data-testid="transaction-details-network-fee-row"
    >
      <Text variant={TextVariant.bodyMd}>{networkFeeFormatted ?? '-'}</Text>
    </TransactionDetailsRow>
  );
}
