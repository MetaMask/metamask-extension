import React, { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { TransactionPayTotals } from '@metamask/transaction-pay-controller';
import {
  IconColor,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { PopoverPosition } from '../../../../../components/component-library';
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
import { useConfirmContext } from '../../../context/confirm';
import { isPerpsWithdrawTransaction } from '../../../../../../shared/lib/transactions.utils';
import { InfoPopoverTooltip } from '../../info-popover-tooltip';

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
  const formatFiat = useFiatFormatter({ overrideCurrency: 'usd' });
  const isLoading = useIsTransactionPayLoading();
  const quotes = useTransactionPayQuotes();
  const totals = useTransactionPayTotals();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const isPerpsWithdraw = isPerpsWithdrawTransaction(currentConfirmation);

  const feeLabel = t('transactionFee');

  const feeTotalUsd = useMemo(() => {
    if (!totals?.fees) {
      return '';
    }

    const totalFee = new BigNumber(totals.fees.provider.usd)
      .plus(totals.fees.metaMask?.usd ?? '0')
      .plus(totals.fees.sourceNetwork.estimate.usd)
      .plus(totals.fees.targetNetwork.usd);

    return formatFiat(totalFee.toNumber());
  }, [totals, formatFiat]);

  const metamaskFeeUsd = useMemo(() => {
    const raw = new BigNumber(totals?.fees?.metaMask?.usd ?? '0');
    // Show "<$0.01" when fee is positive but rounds to $0.00 so users can see
    // the fee is actually collected (Intl.NumberFormat uses 2 decimal places).
    if (raw.gt(0) && raw.lt('0.01')) {
      return `<${formatFiat(0.01)}`;
    }
    return formatFiat(raw.toNumber());
  }, [totals, formatFiat]);

  const isSmall = variant === ConfirmInfoRowSize.Small;

  const hasQuotes = Boolean(quotes?.length);

  const tooltipLines = useMemo(() => {
    if (!hasQuotes || !totals) {
      return undefined;
    }
    return buildTooltipLines({
      description: tooltipDescription,
      t,
      totals,
      formatFiat,
      metamaskFeeFormatted: metamaskFeeUsd,
      includeMetamaskFee: isSmall,
      useProviderFeeLabel: isPerpsWithdraw,
    });
  }, [
    hasQuotes,
    totals,
    tooltipDescription,
    t,
    formatFiat,
    metamaskFeeUsd,
    isSmall,
    isPerpsWithdraw,
  ]);

  if (isLoading) {
    return (
      <ConfirmInfoRowSkeleton
        data-testid="bridge-fee-row-skeleton"
        label={feeLabel}
        rowVariant={variant}
      />
    );
  }

  return (
    <ConfirmInfoRow
      data-testid="bridge-fee-row"
      label={feeLabel}
      rowVariant={variant}
      labelChildren={
        tooltipLines ? (
          <InfoPopoverTooltip
            position={PopoverPosition.Top}
            offset={[0, 16]}
            iconName={IconName.Question}
            iconColor={IconColor.IconAlternative}
            iconMarginLeft={1}
            plainIcon
            ariaLabel={feeLabel}
            data-testid="bridge-fee-tooltip-popover"
          >
            <Text variant={TextVariant.BodyMd} color={TextColor.InfoInverse}>
              {tooltipLines.map((line, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <br />}
                  {line}
                </React.Fragment>
              ))}
            </Text>
          </InfoPopoverTooltip>
        ) : undefined
      }
    >
      {isSmall ? (
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
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

type BuildTooltipLinesArgs = {
  description: string | undefined;
  t: ReturnType<typeof useI18nContext>;
  totals: TransactionPayTotals;
  formatFiat: ReturnType<typeof useFiatFormatter>;
  metamaskFeeFormatted: string;
  includeMetamaskFee: boolean;
  useProviderFeeLabel?: boolean;
};

function buildTooltipLines({
  description,
  t,
  totals,
  formatFiat,
  metamaskFeeFormatted,
  includeMetamaskFee,
  useProviderFeeLabel,
}: BuildTooltipLinesArgs): string[] {
  const networkFee = new BigNumber(totals.fees.sourceNetwork.estimate.usd).plus(
    totals.fees.targetNetwork.usd,
  );

  const providerFeeUsd = new BigNumber(totals.fees.provider.usd);

  const lines: string[] = [];

  if (description) {
    lines.push(description);
    lines.push('');
  }

  lines.push(
    `${t('networkFee')}: ${formatFiat(networkFee.toNumber())}`,
    `${useProviderFeeLabel ? t('providerFee') : t('bridgeFee')}: ${formatFiat(
      providerFeeUsd.toNumber(),
    )}`,
  );

  if (includeMetamaskFee) {
    lines.push(`${t('metamaskFee')}: ${metamaskFeeFormatted}`);
  }

  return lines;
}
