import { useCallback } from 'react';
import {
  MoneyButtonIntent,
  MoneyButtonType,
  MoneyComponentName,
  MoneyFtueEntryPoint,
  MoneyScreenName,
} from '../../pages/money/constants/money-events';
import type { MoneyDepositToken } from './money-deposit-token-utils';
import { useMoneyAccountDeposit } from './useMoneyAccountDeposit';
import { useMoneyAnalytics } from './useMoneyAnalytics';

type UseMoneyAddDepositTokenOptions = {
  screenName: MoneyScreenName;
  tokenRowComponentName: MoneyComponentName;
  ftueEntryPoint: MoneyFtueEntryPoint;
};

type AddTokenTracking = {
  componentName: MoneyComponentName;
  labelKey: string;
};

/**
 * Shared Add-token handler for Earn on your crypto surfaces.
 *
 * Tracks the token Add click and opens the same deposit flow as Money Home
 * Add, pre-selecting the token. Callers other than a token row (e.g. the
 * Convert CTA) pass their own component name and label.
 *
 * @param options - Where the token list lives, for analytics.
 * @param options.screenName
 * @param options.tokenRowComponentName
 * @param options.ftueEntryPoint - Entry point recorded when this deposit opens the FTUE.
 * @returns The Add handler, the underlying deposit initiator, and loading state.
 */
export function useMoneyAddDepositToken({
  screenName,
  tokenRowComponentName,
  ftueEntryPoint,
}: UseMoneyAddDepositTokenOptions) {
  const { initiateDeposit, isLoading: isDepositLoading } =
    useMoneyAccountDeposit();
  const { trackTokenButtonClicked } = useMoneyAnalytics({ screenName });

  const handleAddToken = useCallback(
    (
      token: MoneyDepositToken,
      tokenIndex: number,
      tokenCount: number,
      { componentName, labelKey }: AddTokenTracking = {
        componentName: tokenRowComponentName,
        labelKey: 'moneyAdd',
      },
    ) => {
      trackTokenButtonClicked({
        buttonType: MoneyButtonType.Text,
        buttonIntent: MoneyButtonIntent.AddMoney,
        componentName,
        labelKey,
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
        ftueOrigin: { entryPoint: ftueEntryPoint, componentName },
      });
    },
    [
      ftueEntryPoint,
      initiateDeposit,
      tokenRowComponentName,
      trackTokenButtonClicked,
    ],
  );

  return { handleAddToken, initiateDeposit, isDepositLoading };
}
