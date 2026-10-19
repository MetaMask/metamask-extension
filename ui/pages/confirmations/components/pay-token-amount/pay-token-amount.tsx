import React, { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { Skeleton } from '@metamask/design-system-react';
import { Box, Text } from '../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useTransactionPayToken } from '../../hooks/pay/useTransactionPayToken';
import {
  useIsTransactionPayLoading,
  useSolanaPayQuote,
  useTransactionPayIsMaxAmount,
} from '../../hooks/pay/useTransactionPayData';
import { useTransactionPayAvailableTokens } from '../../hooks/pay/useTransactionPayAvailableTokens';
import {
  selectTransactionPaySourceByTransactionId,
  type TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { useConfirmContext } from '../../context/confirm';
import { formatAmount } from '../../../../../shared/lib/format-amount';
import { getTokenAddress } from '../../utils/transaction-pay';
import { useTokenFiatRates } from '../../hooks/tokens/useTokenFiatRates';
import { getCurrentLocale } from '../../../../ducks/locale/locale';

export type PayTokenAmountProps = {
  amountHuman: string;
  disabled?: boolean;
};

export function PayTokenAmount({ amountHuman, disabled }: PayTokenAmountProps) {
  const locale = useSelector(getCurrentLocale) ?? 'en';
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const { chainId } = currentConfirmation ?? { chainId: '0x0' as Hex };
  const { payToken } = useTransactionPayToken();
  const solanaPayQuote = useSolanaPayQuote();
  const availableTokens = useTransactionPayAvailableTokens();
  const paySource = useSelector((state: TransactionPayState) =>
    selectTransactionPaySourceByTransactionId(state, transactionId),
  );
  const solanaToken = availableTokens.find(
    ({ accountAddress, assetId, chainId: sourceChainId }) =>
      `${String(sourceChainId)}:${accountAddress}` ===
        paySource?.sourceAccountId && assetId === paySource?.sourceAssetId,
  );
  const targetTokenAddress = getTokenAddress(currentConfirmation);
  const isQuotesLoading = useIsTransactionPayLoading();
  const isMaxAmount = useTransactionPayIsMaxAmount();

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

  const formattedSolanaAmount = useMemo(() => {
    if (!solanaPayQuote || !solanaToken) {
      return undefined;
    }
    return formatAmount(
      locale,
      new BigNumber(solanaPayQuote.preflight.sourceAmountRaw).dividedBy(
        new BigNumber(10).pow(solanaToken.decimals ?? 0),
      ),
    );
  }, [locale, solanaPayQuote, solanaToken]);

  const formattedAmount = useMemo(() => {
    const payTokenFiatRate = fiatRates[0];
    const assetFiatRate = fiatRates[1];

    if (disabled || !payToken || !payTokenFiatRate || !assetFiatRate) {
      return undefined;
    }

    const assetToPayTokenRate = new BigNumber(String(assetFiatRate)).dividedBy(
      String(payTokenFiatRate),
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

  if (paySource?.sourceAccountId.startsWith('solana:')) {
    if (!formattedSolanaAmount || !solanaToken) {
      return <PayTokenAmountSkeleton />;
    }
    return (
      <Box data-testid="pay-token-amount">
        <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
          {formattedSolanaAmount} {solanaToken.symbol}
        </Text>
      </Box>
    );
  }

  if (!formattedAmount || (isQuotesLoading && isMaxAmount)) {
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

export function PayTokenAmountSkeleton() {
  return (
    <Box data-testid="pay-token-amount-skeleton">
      <Skeleton width={90} height={25} />
    </Box>
  );
}
