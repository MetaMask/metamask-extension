import { getValueFromWeiHex } from '../../../shared/lib/conversion.utils';
import { getMetaMaskCachedBalances, getUSDConversionRate } from '../selectors';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../multichain-accounts/account-tree';
import type { MetaMaskReduxState } from '../../store/types';

// Selected EVM account's native balance in USD, as a decimal string ("8.90").
// This is `totalFiatBalance` from `useAccountTotalFiatBalance(account, _, true)`.
// ERC-20 balances are omitted: `useTokenTracker` reports 0 for every token, so
// they have never been part of that total. Read it with `store.getState()`
// inside a handler so balance and rate updates do not re-render the caller.
export function getSelectedEvmAccountUsdBalance(state: MetaMaskReduxState) {
  const account = getInternalAccountBySelectedAccountGroupAndCaip(
    state,
    'eip155:1',
  );
  const cachedBalances = getMetaMaskCachedBalances(state) as Record<
    string,
    string
  >;
  const balance = account ? (cachedBalances?.[account.address] ?? 0) : 0;

  return getValueFromWeiHex({
    value: balance,
    toCurrency: 'usd',
    conversionRate: getUSDConversionRate(state),
    numberOfDecimals: 2,
  });
}
