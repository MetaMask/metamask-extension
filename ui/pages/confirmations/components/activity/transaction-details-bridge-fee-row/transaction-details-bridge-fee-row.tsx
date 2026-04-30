import React, { useMemo } from 'react';
import { TransactionType } from '@metamask/transaction-controller';
import { Text } from '../../../../../components/component-library';
import { TextVariant } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';
import { TransactionDetailsRow } from '../transaction-details-row';
import { useTransactionDetails } from '../transaction-details-context';
import { hasTransactionType } from '../../../../../../shared/lib/transactions.utils';

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

  const isWithdraw = hasTransactionType(transactionMeta, [
    TransactionType.perpsWithdraw,
  ]);
  const label = isWithdraw ? t('providerFee') : t('bridgeFee');

  return (
    <TransactionDetailsRow
      label={label}
      data-testid="transaction-details-bridge-fee-row"
    >
      <Text variant={TextVariant.bodyMd}>{bridgeFeeFormatted}</Text>
    </TransactionDetailsRow>
  );
}
