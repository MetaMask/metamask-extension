import React, { useMemo } from 'react';
import { Text } from '../../../../../components/component-library';
import { TextVariant } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';
import { TransactionDetailsRow } from '../transaction-details-row';
import { useTransactionDetails } from '../transaction-details-context';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function TransactionDetailsBridgeFeeRow() {
  const t = useI18nContext();
  const { transactionMeta } = useTransactionDetails();
  const fiatFormatter = useFiatFormatter();

  const { metamaskPay } = transactionMeta;
  const { bridgeFeeFiat } = metamaskPay || {};

  const bridgeFeeFormatted = useMemo(() => {
    if (!bridgeFeeFiat) {
      return null;
    }
    return fiatFormatter(Number(bridgeFeeFiat));
  }, [fiatFormatter, bridgeFeeFiat]);

  if (!bridgeFeeFiat) {
    return null;
  }

  return (
    <TransactionDetailsRow
      label={t('bridgeFee')}
      data-testid="transaction-details-bridge-fee-row"
    >
      <Text variant={TextVariant.bodyMd}>{bridgeFeeFormatted}</Text>
    </TransactionDetailsRow>
  );
}
