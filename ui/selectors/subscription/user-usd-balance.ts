import { getValueFromWeiHex } from '../../../shared/lib/conversion.utils';
import { getMetaMaskCachedBalances, getUSDConversionRate } from '../selectors';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../multichain-accounts/account-tree';
import type { MetaMaskReduxState } from '../../store/types';

/**
 * The selected account group's EVM balance in USD, as a decimal string
 * (e.g. "8.90"). This is what `useAccountTotalFiatBalance(account, _, true)`
 * returns as `totalFiatBalance`, without subscribing a component to it.
 *
 * ERC-20 balances are not included: `useTokenTracker` reports a zero balance
 * for every token, so they have never contributed to that total. Keep this in
 * sync with `useAccountTotalFiatBalance` if that changes (see the parity test).
 *
 * Read it with `store.getState()` inside event handlers and async callbacks,
 * so that balance and exchange-rate updates do not re-render the caller.
 *
 * @param state - The Redux state.
 * @returns The USD balance, or "0" when it cannot be determined.
 */
export function getSelectedEvmAccountUsdBalance(
  state: MetaMaskReduxState,
): string {
  const account = getInternalAccountBySelectedAccountGroupAndCaip(
    state,
    'eip155:1',
  );
  const balance = account
    ? ((getMetaMaskCachedBalances(state) as Record<string, string>)?.[
        account.address
      ] ?? 0)
    : 0;

  return getValueFromWeiHex({
    value: balance,
    toCurrency: 'usd',
    conversionRate: getUSDConversionRate(state) ?? undefined,
    numberOfDecimals: 2,
  });
}
