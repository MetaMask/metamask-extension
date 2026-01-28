import React, { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import type { TransactionPayTotals } from '@metamask/transaction-pay-controller';
import { Text } from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  ConfirmInfoRow,
  ConfirmInfoRowSize,
  ConfirmInfoRowSkeleton,
} from '../../../../../components/app/confirm/info/row/row';
import {
  useIsTransactionPayLoading,
  useTransactionPayQuotes,
  useTransactionPayTotals,
} from '../../../hooks/pay/useTransactionPayData';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function BridgeFeeRow() {
  const t = useI18nContext();
  const formatFiat = useFiatFormatter();
  const isLoading = useIsTransactionPayLoading();
  const quotes = useTransactionPayQuotes();
  const totals = useTransactionPayTotals();

  const feeTotalUsd = useMemo(() => {
    if (!totals?.fees) {
      return '';
    }

    const totalFee = new BigNumber(totals.fees.provider.usd)
      .plus(totals.fees.sourceNetwork.estimate.usd)
      .plus(totals.fees.targetNetwork.usd);

    return formatFiat(totalFee.toNumber());
  }, [totals, formatFiat]);

  const metamaskFeeUsd = useMemo(() => formatFiat(0), [formatFiat]);

  if (isLoading) {
    return (
      <>
        <ConfirmInfoRowSkeleton data-testid="bridge-fee-row-skeleton" />
        <ConfirmInfoRowSkeleton data-testid="metamask-fee-row-skeleton" />
      </>
    );
  }

  const hasQuotes = Boolean(quotes?.length);

  return (
    <>
      <ConfirmInfoRow
        data-testid="bridge-fee-row"
        label={t('transactionFee')}
        rowVariant={ConfirmInfoRowSize.Small}
        tooltip={
          hasQuotes && totals
            ? renderTooltipContent(t, totals, formatFiat)
            : undefined
        }
      >
        <Text
          variant={TextVariant.bodyMd}
          color={TextColor.textAlternative}
          data-testid="transaction-fee-value"
        >
          {feeTotalUsd}
        </Text>
      </ConfirmInfoRow>
      {hasQuotes && (
        <ConfirmInfoRow
          data-testid="metamask-fee-row"
          label={t('metamaskFee')}
          rowVariant={ConfirmInfoRowSize.Small}
        >
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
            {metamaskFeeUsd}
          </Text>
        </ConfirmInfoRow>
      )}
    </>
  );
}

function renderTooltipContent(
  t: ReturnType<typeof useI18nContext>,
  totals: TransactionPayTotals,
  formatFiat: ReturnType<typeof useFiatFormatter>,
): string {
  const networkFee = new BigNumber(totals.fees.sourceNetwork.estimate.usd).plus(
    totals.fees.targetNetwork.usd,
  );

  const providerFee = new BigNumber(totals.fees.provider.usd);

  return `${t('networkFee')}: ${formatFiat(networkFee.toNumber())}\n${t('bridgeFee')}: ${formatFiat(providerFee.toNumber())}`;
}
