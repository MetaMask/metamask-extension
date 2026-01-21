import React, { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { Box, Text } from '../../../../components/component-library';
import { Skeleton } from '../../../../components/component-library/skeleton';
import {
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useTransactionPayToken } from '../../hooks/pay/useTransactionPayToken';
import { useIsTransactionPayLoading } from '../../hooks/pay/useTransactionPayData';
import { useConfirmContext } from '../../context/confirm';
import { formatAmount } from '../simulation-details/formatAmount';
import { getTokenAddress } from '../../utils/transaction-pay';
import { useTokenFiatRates } from '../../hooks/tokens/useTokenFiatRates';
import { getCurrentLocale } from '../../../../ducks/locale/locale';

export type PayTokenAmountProps = {
  amountHuman: string;
  disabled?: boolean;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export function PayTokenAmount({ amountHuman, disabled }: PayTokenAmountProps) {
  const locale = useSelector(getCurrentLocale) ?? 'en';
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { chainId } = currentConfirmation ?? { chainId: '0x0' as Hex };
  const { payToken } = useTransactionPayToken();
  const targetTokenAddress = getTokenAddress(currentConfirmation);
  const isQuotesLoading = useIsTransactionPayLoading();

  const fiatRequests = useMemo(
    () =>
      payToken && targetTokenAddress
        ? [
            {
              chainId: payToken.chainId,
              address: payToken.address,
            },
            {
              chainId: chainId as Hex,
              address: targetTokenAddress,
            },
          ]
        : [],
    [chainId, payToken, targetTokenAddress],
  );

  const fiatRates = useTokenFiatRates(fiatRequests);

  const formattedAmount = useMemo(() => {
    const payTokenFiatRate = fiatRates[0];
    const assetFiatRate = fiatRates[1];

    if (disabled || !payToken || !payTokenFiatRate || !assetFiatRate) {
      return undefined;
    }

    const assetToPayTokenRate = new BigNumber(assetFiatRate).dividedBy(
      payTokenFiatRate,
    );

    const payTokenAmount = new BigNumber(amountHuman || '0').times(
      assetToPayTokenRate,
    );

    return formatAmount(locale, payTokenAmount);
  }, [amountHuman, disabled, payToken, fiatRates, locale]);

  if (disabled) {
    return (
      <Box data-testid="pay-token-amount">
        <Text color={TextColor.textMuted}>0 ETH</Text>
      </Box>
    );
  }

  if (!formattedAmount || isQuotesLoading) {
    return <PayTokenAmountSkeleton />;
  }

  return (
    <Box data-testid="pay-token-amount">
      <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
        {formattedAmount} {payToken?.symbol}
      </Text>
    </Box>
  );
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function PayTokenAmountSkeleton() {
  return (
    <Box data-testid="pay-token-amount-skeleton">
      <Skeleton width={90} height={25} />
    </Box>
  );
}
