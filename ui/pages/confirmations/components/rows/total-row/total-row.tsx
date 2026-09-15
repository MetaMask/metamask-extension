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
import {
  useIsNetworkFeePaidByMetaMask,
  useIsPaidByMetaMask,
} from '../../../hooks/pay/useIsPaidByMetaMask';
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
  const isNetworkFeePaidByMetaMask = useIsNetworkFeePaidByMetaMask();

  const totalUsd = useMemo(() => {
    if (!totals?.total) {
      return '';
    }

    return formatFiat(
      getDisplayedTotalUsd(
        totals,
        isPaidByMetaMask,
        isNetworkFeePaidByMetaMask,
      ).toNumber(),
    );
  }, [totals, formatFiat, isPaidByMetaMask, isNetworkFeePaidByMetaMask]);

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
 * Pay totals include estimated network gas even when that gas is sponsored.
 * Strip fee components so Total matches what the user actually pays:
 * - fully sponsored (`isPaidByMetaMask`): remove every fee line
 * - network-only sponsored: remove source/target network gas only
 *
 * @param totals - Pay totals for the current confirmation.
 * @param isPaidByMetaMask - Whether every fee component is MetaMask-sponsored.
 * @param isNetworkFeePaidByMetaMask - Whether only network gas is sponsored.
 * @returns The USD total to display.
 */
function getDisplayedTotalUsd(
  totals: TransactionPayTotals,
  isPaidByMetaMask: boolean,
  isNetworkFeePaidByMetaMask: boolean,
): BigNumber {
  const total = new BigNumber(totals.total.usd);

  let feesToExclude = new BigNumber(0);

  if (isPaidByMetaMask) {
    feesToExclude = new BigNumber(totals.fees?.provider?.usd ?? '0')
      .plus(totals.fees?.metaMask?.usd ?? '0')
      .plus(totals.fees?.sourceNetwork?.estimate?.usd ?? '0')
      .plus(totals.fees?.targetNetwork?.usd ?? '0');
  } else if (isNetworkFeePaidByMetaMask) {
    feesToExclude = new BigNumber(
      totals.fees?.sourceNetwork?.estimate?.usd ?? '0',
    ).plus(totals.fees?.targetNetwork?.usd ?? '0');
  }

  if (feesToExclude.isZero()) {
    return total;
  }

  const net = total.minus(feesToExclude);
  return net.lt(0) ? new BigNumber(0) : net;
}
