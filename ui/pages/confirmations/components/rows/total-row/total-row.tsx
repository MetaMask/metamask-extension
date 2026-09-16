import React, { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import type { TransactionPayTotals } from '@metamask/transaction-pay-controller';
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
  useTransactionPayTotals,
} from '../../../hooks/pay/useTransactionPayData';
import { useIsPaidByMetaMask } from '../../../hooks/pay/useIsPaidByMetaMask';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';

export type TotalRowProps = {
  variant?: ConfirmInfoRowSize;
};

export function TotalRow({
  variant = ConfirmInfoRowSize.Default,
}: TotalRowProps) {
  const t = useI18nContext();
  const formatFiat = useFiatFormatter({ overrideCurrency: 'usd' });
  const isLoading = useIsTransactionPayLoading();
  const totals = useTransactionPayTotals();
  const isPaidByMetaMask = useIsPaidByMetaMask();

  const totalUsd = useMemo(() => {
    if (!totals?.total) {
      return '';
    }

    return formatFiat(
      getDisplayedTotalUsd(totals, isPaidByMetaMask).toNumber(),
    );
  }, [totals, formatFiat, isPaidByMetaMask]);

  const isSmall = variant === ConfirmInfoRowSize.Small;
  const textVariant = isSmall ? TextVariant.bodyMd : TextVariant.bodyMdMedium;

  if (isLoading) {
    return (
      <Box data-testid="total-row-skeleton">
        <ConfirmInfoRowSkeleton label={t('total')} rowVariant={variant} />
      </Box>
    );
  }

  return (
    <Box data-testid="total-row">
      <ConfirmInfoRow label={t('total')} rowVariant={variant}>
        {isSmall ? (
          <Text
            variant={textVariant}
            color={TextColor.textAlternative}
            data-testid="total-value"
          >
            {totalUsd}
          </Text>
        ) : (
          <ConfirmInfoRowText text={totalUsd} data-testid="total-value" />
        )}
      </ConfirmInfoRow>
    </Box>
  );
}

/**
 * Pay totals include estimated target-network gas even when that gas is
 * sponsored. Same-token Money Account deposits therefore show "Paid by
 * MetaMask" on the fee row while `totals.total` still adds that gas on top of
 * the typed amount. Strip fee components whenever the fee row claims
 * sponsorship so Total matches what the user actually pays.
 *
 * @param totals - Pay totals for the current confirmation.
 * @param isPaidByMetaMask - Whether the fee row is showing sponsorship.
 * @returns The USD total to display.
 */
function getDisplayedTotalUsd(
  totals: TransactionPayTotals,
  isPaidByMetaMask: boolean,
): BigNumber {
  const total = new BigNumber(totals.total.usd);

  if (!isPaidByMetaMask) {
    return total;
  }

  const fees = new BigNumber(totals.fees?.provider?.usd ?? '0')
    .plus(totals.fees?.metaMask?.usd ?? '0')
    .plus(totals.fees?.sourceNetwork?.estimate?.usd ?? '0')
    .plus(totals.fees?.targetNetwork?.usd ?? '0');
  const net = total.minus(fees);

  return net.lt(0) ? new BigNumber(0) : net;
}
