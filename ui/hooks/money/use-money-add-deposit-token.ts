import { useCallback } from 'react';
import {
  MoneyButtonIntent,
  MoneyButtonType,
  MoneyComponentName,
  MoneyScreenName,
} from '../../pages/money/constants/money-events';
import type { MoneyDepositToken } from './money-deposit-token-utils';
import { useMoneyAccountDeposit } from './useMoneyAccountDeposit';
import { useMoneyAnalytics } from './useMoneyAnalytics';

type UseMoneyAddDepositTokenOptions = {
  screenName: MoneyScreenName;
  tokenRowComponentName: MoneyComponentName;
};

/**
 * Shared Add-token handler for Earn on your crypto surfaces.
 *
 * Tracks the token-row Add click and opens the same deposit flow as Money
 * Home Add, optionally pre-selecting the row's payment token.
 *
 * @param options - Where the token list lives, for analytics.
 * @param options.screenName
 * @param options.tokenRowComponentName
 * @returns The Add handler, the underlying deposit initiator, and loading state.
 */
export function useMoneyAddDepositToken({
  screenName,
  tokenRowComponentName,
}: UseMoneyAddDepositTokenOptions) {
  const { initiateDeposit, isLoading: isDepositLoading } =
    useMoneyAccountDeposit();
  const { trackTokenButtonClicked } = useMoneyAnalytics({ screenName });

  const handleAddToken = useCallback(
    (token: MoneyDepositToken, tokenIndex: number, tokenCount: number) => {
      trackTokenButtonClicked({
        buttonType: MoneyButtonType.Text,
        buttonIntent: MoneyButtonIntent.AddMoney,
        componentName: tokenRowComponentName,
        labelKey: 'moneyAdd',
        redirectTarget: MoneyScreenName.MoneyDeposit,
        tokenSymbol: token.symbol,
        tokenChainId: token.chainId,
        tokenPositionInList: tokenIndex + 1,
        tokensInList: tokenCount,
        tokenHasBalance: token.moneyFiatAmountUsd > 0,
      });
      initiateDeposit({
        preferredPaymentToken: {
          address: token.address,
          chainId: token.chainId,
        },
      });
    },
    [initiateDeposit, tokenRowComponentName, trackTokenButtonClicked],
  );

  return { handleAddToken, initiateDeposit, isDepositLoading };
}
