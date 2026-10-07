import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { isEvmChainId } from '../../../shared/lib/asset-utils';
import { getNetworkConfigurationsByChainId } from '../../../shared/lib/selectors/networks';
import type { TokenWithFiatAmount } from '../../components/app/assets/types';
import {
  getCurrencyRates,
  getCurrentCurrency,
} from '../../ducks/metamask/metamask';
import {
  MoneyButtonIntent,
  MoneyButtonType,
  MoneyComponentName,
  MoneyScreenName,
} from '../../pages/money/constants/money-events';
import { selectBlockedPayTokens } from '../../pages/confirmations/selectors/feature-flags';
import {
  getMoneyTokenKey,
  selectMoneyDepositCtaTokenKeys,
  selectMoneyDepositMinBalance,
  selectMoneyTokenListItemCtaEnabled,
} from '../../selectors/money/money-account-feature-flags';
import { useI18nContext } from '../useI18nContext';
import { getMoneyDepositFiatAmountUsd } from './money-deposit-token-utils';
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
  const ctaTokenKeys = useSelector(selectMoneyDepositCtaTokenKeys);
  const { hasMoneyAccount } = useMoneyAccountInfo();
  const isActive = isCtaEnabled && hasMoneyAccount && ctaTokenKeys.size > 0;

  const { apyPercentFormatted } = useMoneyVaultApy({ enabled: isActive });
  const { initiateDeposit } = useMoneyAccountDeposit();
  const { trackTokenButtonClicked } = useMoneyAnalytics({
    screenName: MoneyScreenName.WalletHome,
    componentName: MoneyComponentName.TokenListItemCta,
  });

  const blockedTokens = useSelector((state) =>
    selectBlockedPayTokens(state, TransactionType.moneyAccountDeposit),
  );
  const minBalance = useSelector(selectMoneyDepositMinBalance);
  const currentCurrency = useSelector(getCurrentCurrency);
  const currencyRates = useSelector(getCurrencyRates);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  const shouldShow = useCallback(
    (token: TokenWithFiatAmount) => {
      if (
        token.isNative ||
        !isEvmChainId(token.chainId) ||
        !ctaTokenKeys.has(getMoneyTokenKey(token.chainId, token.address))
      ) {
        return false;
      }

      return (
        getMoneyDepositFiatAmountUsd(
          {
            accountType: token.accountType,
            address: token.address,
            chainId: token.chainId,
            fiat: { balance: token.tokenFiatAmount ?? undefined },
          },
          {
            blockedTokens,
            minBalance,
            currentCurrency,
            currencyRates,
            networkConfigurations,
          },
        ) !== undefined
      );
    },
    [
      blockedTokens,
      ctaTokenKeys,
      currencyRates,
      currentCurrency,
      minBalance,
      networkConfigurations,
    ],
  );

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
        tokenHasBalance: (token.tokenFiatAmount ?? 0) > 0,
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
            shouldShow,
            onClick,
          }
        : undefined,
    [apyPercentFormatted, isActive, onClick, shouldShow, t],
  );
}
