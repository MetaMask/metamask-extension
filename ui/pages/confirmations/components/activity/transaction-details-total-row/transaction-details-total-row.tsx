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
export function TransactionDetailsTotalRow() {
  const t = useI18nContext();
  const { transactionMeta } = useTransactionDetails();
  const fiatFormatter = useFiatFormatter();

  const { metamaskPay } = transactionMeta;
  const { totalFiat: payTotal, targetFiat } = metamaskPay || {};

  const isWithdraw = hasTransactionType(transactionMeta, [
    TransactionType.perpsWithdraw,
  ]);

  // For withdrawal flows (e.g. Perps Withdraw), surface the amount the user
  // actually received (targetFiat) rather than the "pay total" (input + fees).
  // Mirrors the mobile "Received total" row.
  const amountSource = isWithdraw ? targetFiat : payTotal;

  const totalFormatted = useMemo(() => {
    if (!amountSource) {
      return null;
    }
    return fiatFormatter(Number(amountSource));
  }, [fiatFormatter, amountSource]);

  const label = isWithdraw ? t('receivedTotal') : t('total');

  return (
    <TransactionDetailsRow
      label={label}
      data-testid="transaction-details-total-row"
    >
      <Text variant={TextVariant.bodyMd}>{totalFormatted ?? '-'}</Text>
    </TransactionDetailsRow>
  );
}
