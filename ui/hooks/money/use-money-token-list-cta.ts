import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import type { TokenWithFiatAmount } from '../../components/app/assets/types';
import {
  MoneyButtonIntent,
  MoneyButtonType,
  MoneyComponentName,
  MoneyScreenName,
} from '../../pages/money/constants/money-events';
import { selectMoneyTokenListItemCtaEnabled } from '../../selectors/money/money-account-feature-flags';
import { useI18nContext } from '../useI18nContext';
import { useMoneyDepositCtaEligibility } from './use-money-deposit-cta-eligibility';
import { useMoneyAccountDeposit } from './useMoneyAccountDeposit';
import { useMoneyAccountInfo } from './useMoneyAccountInfo';
import { useMoneyAnalytics } from './useMoneyAnalytics';
import { useMoneyVaultApy } from './useMoneyVaultApy';

const LABEL_KEY = 'moneyGetApy';

export type MoneyTokenListCta = {
  label: string;
  shouldShow: (token: TokenWithFiatAmount) => boolean;
  onClick: (token: TokenWithFiatAmount) => void;
};

const isSameToken = (a: TokenWithFiatAmount, b: TokenWithFiatAmount) =>
  a.chainId === b.chainId &&
  a.address.toLowerCase() === b.address.toLowerCase();

/**
 * The "Get X% APY" Money deposit CTA for token list rows.
 *
 * Resolved once per list rather than per row, so the flag, availability, and
 * APY subscriptions are not repeated for every virtualized row.
 *
 * @param tokens - The token rows in display order, for analytics position.
 * @returns The CTA, or `undefined` when it should not be offered at all.
 */
export function useMoneyTokenListCta(
  tokens: TokenWithFiatAmount[],
): MoneyTokenListCta | undefined {
  const t = useI18nContext();
  const isCtaEnabled = useSelector(selectMoneyTokenListItemCtaEnabled);
  const { hasCtaTokens, isEligible } = useMoneyDepositCtaEligibility();
  const { hasMoneyAccount } = useMoneyAccountInfo();
  const isActive = isCtaEnabled && hasMoneyAccount && hasCtaTokens;

  const { apyPercentFormatted } = useMoneyVaultApy({ enabled: isActive });
  const { initiateDeposit } = useMoneyAccountDeposit();
  const { trackTokenButtonClicked } = useMoneyAnalytics({
    screenName: MoneyScreenName.WalletHome,
    componentName: MoneyComponentName.TokenListItemCta,
  });

  const onClick = useCallback(
    (token: TokenWithFiatAmount) => {
      if (!apyPercentFormatted) {
        return;
      }

      trackTokenButtonClicked({
        buttonType: MoneyButtonType.Text,
        buttonIntent: MoneyButtonIntent.AddMoney,
        labelKey: LABEL_KEY,
        labelSubstitutions: [apyPercentFormatted],
        redirectTarget: MoneyScreenName.MoneyDeposit,
        tokenSymbol: token.symbol,
        tokenChainId: token.chainId,
        tokenPositionInList:
          tokens.findIndex((listToken) => isSameToken(listToken, token)) + 1,
        tokensInList: tokens.length,
        tokenHasBalance: Number(token.balance) > 0,
      });

      initiateDeposit({
        preferredPaymentToken: {
          address: token.address as Hex,
          chainId: token.chainId as Hex,
        },
      });
    },
    [apyPercentFormatted, initiateDeposit, tokens, trackTokenButtonClicked],
  );

  return useMemo(
    () =>
      isActive && apyPercentFormatted
        ? {
            label: t(LABEL_KEY, [apyPercentFormatted]),
            shouldShow: isEligible,
            onClick,
          }
        : undefined,
    [apyPercentFormatted, isActive, isEligible, onClick, t],
  );
}
