import React, { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import { Box, Text } from '../../../../../components/component-library';
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

export type ReceiveRowProps = {
  /** The user's input amount in USD / fiat */
  inputAmountUsd: string;
  variant?: ConfirmInfoRowSize;
};

/**
 * Row that displays "You'll receive" for withdrawal-style confirmations
 * (e.g. Perps Withdraw). Calculates: input - (provider + sourceNetwork +
 * targetNetwork + metamask) fees.
 *
 * Mirrors the mobile `ReceiveRow`.
 *
 * @param options0
 * @param options0.inputAmountUsd
 * @param options0.variant
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function ReceiveRow({
  inputAmountUsd,
  variant = ConfirmInfoRowSize.Default,
}: ReceiveRowProps) {
  const t = useI18nContext();
  // The fee values from `TransactionPayController` (`provider.usd`,
  // `sourceNetwork.estimate.usd`, etc.) are explicitly USD-denominated, and
  // the input is sourced from the `usd`-currency `useTransactionCustomAmount`
  // path used by Perps Withdraw. Force USD formatting so the displayed
  // currency symbol matches the numerical value even if the user has set a
  // non-USD primary currency.
  const formatFiat = useFiatFormatter({ overrideCurrency: 'usd' });
  const isLoading = useIsTransactionPayLoading();
  const totals = useTransactionPayTotals();
  const quotes = useTransactionPayQuotes();

  const hasQuotes = Boolean(quotes?.length);

  const receiveUsd = useMemo(() => {
    if (
      !totals ||
      inputAmountUsd === null ||
      inputAmountUsd === undefined ||
      !hasQuotes
    ) {
      return '';
    }

    const inputUsd = new BigNumber(inputAmountUsd || '0');
    const providerFee = new BigNumber(totals.fees?.provider?.usd ?? 0);
    const sourceNetworkFee = new BigNumber(
      totals.fees?.sourceNetwork?.estimate?.usd ?? 0,
    );
    const targetNetworkFee = new BigNumber(
      totals.fees?.targetNetwork?.usd ?? 0,
    );
    const metaMaskFee = new BigNumber(totals.fees?.metaMask?.usd ?? 0);

    const totalFees = providerFee
      .plus(sourceNetworkFee)
      .plus(targetNetworkFee)
      .plus(metaMaskFee);
    const youReceive = inputUsd.minus(totalFees);

    return formatFiat(
      (youReceive.gte(0) ? youReceive : new BigNumber(0)).toNumber(),
    );
  }, [hasQuotes, inputAmountUsd, totals, formatFiat]);

  const isSmall = variant === ConfirmInfoRowSize.Small;
  const textVariant = isSmall ? TextVariant.bodyMd : TextVariant.bodyMdMedium;

  if (isLoading) {
    return (
      <Box data-testid="receive-row-skeleton">
        <ConfirmInfoRowSkeleton
          label={t('youllReceive')}
          rowVariant={variant}
        />
      </Box>
    );
  }

  return (
    <Box data-testid="receive-row">
      <ConfirmInfoRow label={t('youllReceive')} rowVariant={variant}>
        {isSmall ? (
          <Text
            variant={textVariant}
            color={TextColor.textAlternative}
            data-testid="receive-value"
          >
            {receiveUsd}
          </Text>
        ) : (
          <ConfirmInfoRowText text={receiveUsd} data-testid="receive-value" />
        )}
      </ConfirmInfoRow>
    </Box>
  );
}
