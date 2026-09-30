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
  getUserPaidNetworkFeeUsd,
  type SponsoredNetworkFeeFlags,
} from '../../../hooks/pay/sponsored-network-fees';
import {
  useIsPaidByMetaMask,
  useSponsoredNetworkFeeFlags,
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
  const sponsoredNetworkFees = useSponsoredNetworkFeeFlags();

  const totalUsd = useMemo(() => {
    if (!totals?.total) {
      return '';
    }

    return formatFiat(
      getDisplayedTotalUsd(
        totals,
        isPaidByMetaMask,
        sponsoredNetworkFees,
      ).toNumber(),
    );
  }, [totals, formatFiat, isPaidByMetaMask, sponsoredNetworkFees]);

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
 * Strip fee components so Total matches what the user actually pays.
 *
 * Fully sponsored (`isPaidByMetaMask`): remove every fee line.
 * Otherwise: remove only network legs flagged as sponsored (target always when
 * gas-sponsored; source only on same-chain routes).
 *
 * @param totals - Pay totals for the current confirmation.
 * @param isPaidByMetaMask - Whether every fee component is MetaMask-sponsored.
 * @param sponsoredNetworkFees - Which network fee legs are sponsored.
 * @returns The USD total to display.
 */
function getDisplayedTotalUsd(
  totals: TransactionPayTotals,
  isPaidByMetaMask: boolean,
  sponsoredNetworkFees: SponsoredNetworkFeeFlags,
): BigNumber {
  const total = new BigNumber(totals.total.usd);

  let feesToExclude = new BigNumber(0);

  if (isPaidByMetaMask) {
    feesToExclude = new BigNumber(totals.fees?.provider?.usd ?? '0')
      .plus(totals.fees?.metaMask?.usd ?? '0')
      .plus(totals.fees?.sourceNetwork?.estimate?.usd ?? '0')
      .plus(totals.fees?.targetNetwork?.usd ?? '0');
  } else {
    const fullNetwork = new BigNumber(
      totals.fees?.sourceNetwork?.estimate?.usd ?? '0',
    ).plus(totals.fees?.targetNetwork?.usd ?? '0');
    const userPaidNetwork = getUserPaidNetworkFeeUsd(
      totals.fees,
      sponsoredNetworkFees,
    );
    feesToExclude = fullNetwork.minus(userPaidNetwork);
  }

  if (feesToExclude.isZero()) {
    return total;
  }

  const net = total.minus(feesToExclude);
  return net.lt(0) ? new BigNumber(0) : net;
}
