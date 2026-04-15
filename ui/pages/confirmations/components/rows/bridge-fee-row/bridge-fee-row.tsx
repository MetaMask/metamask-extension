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
import { ConfirmInfoRowText } from '../../../../../components/app/confirm/info/row/text';
import {
  useIsTransactionPayLoading,
  useTransactionPayQuotes,
  useTransactionPayTotals,
} from '../../../hooks/pay/useTransactionPayData';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';

export type BridgeFeeRowProps = {
  variant?: ConfirmInfoRowSize;
  /**
   * When set, this text is shown first in the tooltip, then newline-separated fee lines
   * (e.g. mUSD conversion copy from the parent).
   */
  tooltipDescription?: string;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export function BridgeFeeRow({
  variant = ConfirmInfoRowSize.Default,
  tooltipDescription,
}: BridgeFeeRowProps) {
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

  const isSmall = variant === ConfirmInfoRowSize.Small;
  const textVariant = isSmall ? TextVariant.bodyMd : TextVariant.bodyMdMedium;

  if (isLoading) {
    return (
      <ConfirmInfoRowSkeleton
        data-testid="bridge-fee-row-skeleton"
        label={t('transactionFee')}
        rowVariant={variant}
      />
    );
  }

  const hasQuotes = Boolean(quotes?.length);

  let tooltipContent: string | undefined;
  if (hasQuotes && totals) {
    tooltipContent = renderTooltipContent({
      description: tooltipDescription,
      t,
      totals,
      formatFiat,
      metamaskFeeFormatted: metamaskFeeUsd,
      /** Matches prior behavior: MetaMask fee was only shown for Small variant (body row). */
      includeMetamaskFee: isSmall,
    });
  }

  return (
    <ConfirmInfoRow
      data-testid="bridge-fee-row"
      label={t('transactionFee')}
      rowVariant={variant}
      tooltip={tooltipContent}
    >
      {isSmall ? (
        <Text
          variant={textVariant}
          color={TextColor.textAlternative}
          data-testid="transaction-fee-value"
        >
          {feeTotalUsd}
        </Text>
      ) : (
        <ConfirmInfoRowText
          text={feeTotalUsd}
          data-testid="transaction-fee-value"
        />
      )}
    </ConfirmInfoRow>
  );
}

type RenderTooltipContentArgs = {
  description: string | undefined;
  t: ReturnType<typeof useI18nContext>;
  totals: TransactionPayTotals;
  formatFiat: ReturnType<typeof useFiatFormatter>;
  metamaskFeeFormatted: string;
  includeMetamaskFee: boolean;
};

function renderTooltipContent({
  description,
  t,
  totals,
  formatFiat,
  metamaskFeeFormatted,
  includeMetamaskFee,
}: RenderTooltipContentArgs): string {
  const networkFee = new BigNumber(totals.fees.sourceNetwork.estimate.usd).plus(
    totals.fees.targetNetwork.usd,
  );

  const bridgeFeeUsd = new BigNumber(totals.fees.provider.usd);

  const lines: string[] = [];

  if (description) {
    lines.push(description);
    lines.push('');
  }

  lines.push(
    `${t('networkFee')}: ${formatFiat(networkFee.toNumber())}`,
    `${t('bridgeFee')}: ${formatFiat(bridgeFeeUsd.toNumber())}`,
  );

  if (includeMetamaskFee) {
    lines.push(`${t('metamaskFee')}: ${metamaskFeeFormatted}`);
  }

  return lines.join('\n');
}
