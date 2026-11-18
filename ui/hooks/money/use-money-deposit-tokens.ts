import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { getNetworkConfigurationsByChainId } from '../../../shared/lib/selectors/networks';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import {
  getCurrencyRates,
  getCurrentCurrency,
} from '../../ducks/metamask/metamask';
import { useSendTokens } from '../../pages/confirmations/hooks/send/useSendTokens';
import { selectBlockedPayTokens } from '../../pages/confirmations/selectors/feature-flags';
import { selectMoneyDepositMinBalance } from '../../selectors/money/money-account-feature-flags';
import { useIsHardwareWalletAccount } from '../useIsHardwareWalletAccount';
import {
  filterMoneyDepositTokens,
  isNoFeeMoneyDepositToken,
  parseMoneySubsidizedRoutes,
  type MoneyDepositToken,
} from './money-deposit-token-utils';

/**
 * Returns wallet assets eligible to fund the Money account.
 *
 * Nothing is no-fee when the selected account is a hardware wallet.
 *
 * @returns Eligible tokens and a no-fee classifier.
 */
export function useMoneyDepositTokens(): {
  tokens: MoneyDepositToken[];
  isNoFeeToken: (token: MoneyDepositToken) => boolean;
} {
  const assets = useSendTokens({ includeNoBalance: false });
  const blockedTokens = useSelector((state) =>
    selectBlockedPayTokens(state, TransactionType.moneyAccountDeposit),
  );
  const minBalance = useSelector(selectMoneyDepositMinBalance);
  const currentCurrency = useSelector(getCurrentCurrency);
  const currencyRates = useSelector(getCurrencyRates);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const remoteFeatureFlags = useSelector(getRemoteFeatureFlags);

  const tokens = useMemo(
    () =>
      filterMoneyDepositTokens({
        assets,
        blockedTokens,
        minBalance,
        currentCurrency,
        currencyRates,
        networkConfigurations,
      }),
    [
      assets,
      blockedTokens,
      minBalance,
      currentCurrency,
      currencyRates,
      networkConfigurations,
    ],
  );
  const subsidizedRoutes = useMemo(
    () =>
      parseMoneySubsidizedRoutes(
        remoteFeatureFlags?.confirmations_relay_fixed_spread,
      ),
    [remoteFeatureFlags],
  );
  // Hardware accounts cannot use sponsored routes.
  const isHardwareAccount = useIsHardwareWalletAccount();
  const isNoFeeToken = useCallback(
    (token: MoneyDepositToken) =>
      !isHardwareAccount && isNoFeeMoneyDepositToken(token, subsidizedRoutes),
    [isHardwareAccount, subsidizedRoutes],
  );

  return { tokens, isNoFeeToken };
}
