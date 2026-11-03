import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { isEvmChainId } from '../../../shared/lib/asset-utils';
import { getNetworkConfigurationsByChainId } from '../../../shared/lib/selectors/networks';
import type { TokenWithFiatAmount } from '../../components/app/assets/types';
import {
  getCurrencyRates,
  getCurrentCurrency,
} from '../../ducks/metamask/metamask';
import { selectBlockedPayTokens } from '../../pages/confirmations/selectors/feature-flags';
import {
  getMoneyTokenKey,
  selectMoneyDepositCtaTokenKeys,
  selectMoneyDepositMinBalance,
} from '../../selectors/money/money-account-feature-flags';
import { getMoneyDepositFiatAmountUsd } from './money-deposit-token-utils';

export type MoneyDepositCtaToken = Pick<
  TokenWithFiatAmount,
  'accountType' | 'chainId' | 'isNative' | 'tokenFiatAmount'
> & { address: string };

/**
 * Per-token eligibility for Money deposit CTAs: the token must be an
 * allowlisted ERC-20 that can fund a Money account, i.e. not blocked and at or
 * above the minimum USD balance.
 *
 * Feature flags and Money account availability are left to the caller, as
 * each CTA surface has its own flag.
 *
 * @returns Whether any token is allowlisted, the token's eligible USD value
 * (`undefined` when ineligible), and a token predicate.
 */
export function useMoneyDepositCtaEligibility() {
  const ctaTokenKeys = useSelector(selectMoneyDepositCtaTokenKeys);
  const blockedTokens = useSelector((state) =>
    selectBlockedPayTokens(state, TransactionType.moneyAccountDeposit),
  );
  const minBalance = useSelector(selectMoneyDepositMinBalance);
  const currentCurrency = useSelector(getCurrentCurrency);
  const currencyRates = useSelector(getCurrencyRates);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  const getEligibleFiatAmountUsd = useCallback(
    (token: MoneyDepositCtaToken) => {
      if (
        token.isNative ||
        !isEvmChainId(token.chainId) ||
        !ctaTokenKeys.has(getMoneyTokenKey(token.chainId, token.address))
      ) {
        return undefined;
      }

      return getMoneyDepositFiatAmountUsd(
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

  const isEligible = useCallback(
    (token: MoneyDepositCtaToken) =>
      getEligibleFiatAmountUsd(token) !== undefined,
    [getEligibleFiatAmountUsd],
  );

  return {
    hasCtaTokens: ctaTokenKeys.size > 0,
    getEligibleFiatAmountUsd,
    isEligible,
  };
}
