import { useSelector } from 'react-redux';
import {
  getCurrentNetwork,
  getInternalAccountByAddress,
  getNativeTokenCachedBalanceByChainIdSelector,
  getSelectedAccountCachedBalance,
  getShouldHideZeroBalanceTokens,
  getShowFiatInTestnets,
} from '../../../selectors';
import { TEST_NETWORKS } from '../../../../shared/constants/network';
import { useAccountTotalFiatBalance } from '../../../hooks/useAccountTotalFiatBalance';

/**
 * Hook to get the balance for a given address.
 *
 * @param {string} fromAddress - The address to get the balance for.
 * @param {string} [chainId] - Optional chain ID to get the balance for a
 * specific network. When provided, returns the native token balance for that
 * chain instead of the currently selected network's balance.
 * @returns {{ balance?: string }} The balance in wei hex, or an empty object
 * if no address is provided.
 */
export const useBalance = (fromAddress, chainId) => {
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );

  const fromAccount = useSelector((state) =>
    getInternalAccountByAddress(state, fromAddress),
  );

  const { totalWeiBalance } = useAccountTotalFiatBalance(
    fromAccount,
    shouldHideZeroBalanceTokens,
  );

  const currentNetwork = useSelector(getCurrentNetwork);

  const showFiatInTestnets = useSelector(getShowFiatInTestnets);
  const showFiat =
    TEST_NETWORKS.includes(currentNetwork?.nickname) && !showFiatInTestnets;

  const chainBalances = useSelector((state) =>
    getNativeTokenCachedBalanceByChainIdSelector(state, fromAddress ?? ''),
  );

  const selectedAccountBalance = useSelector(getSelectedAccountCachedBalance);

  if (!fromAddress) {
    return {};
  }

  if (chainId) {
    return { balance: chainBalances?.[chainId] ?? '0x0' };
  }

  let balanceToUse = totalWeiBalance;

  if (showFiat) {
    balanceToUse = selectedAccountBalance;
  }

  return { balance: balanceToUse };
};
