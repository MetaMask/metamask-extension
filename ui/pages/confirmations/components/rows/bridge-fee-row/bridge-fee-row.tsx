import React, { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import type { TransactionPayTotals } from '@metamask/transaction-pay-controller';
import { Box, Text } from '../../../../../components/component-library';
import { Skeleton } from '../../../../../components/component-library/skeleton';
import {
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { ConfirmInfoRow } from '../../../../../components/app/confirm/info/row/row';
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
        <BridgeFeeRowSkeleton testId="bridge-fee-row-skeleton" />
        <BridgeFeeRowSkeleton testId="metamask-fee-row-skeleton" />
      </>
    );
  }

  const hasQuotes = Boolean(quotes?.length);

  return (
    <>
      <ConfirmInfoRow
        data-testid="bridge-fee-row"
        label={t('transactionFee')}
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
        <ConfirmInfoRow data-testid="metamask-fee-row" label={t('metamaskFee')}>
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
            {metamaskFeeUsd}
          </Text>
        </ConfirmInfoRow>
      )}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function BridgeFeeRowSkeleton({ testId }: { testId: string }) {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      data-testid={testId}
    >
      <Skeleton width={100} height={20} />
      <Skeleton width={80} height={20} />
    </Box>
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
