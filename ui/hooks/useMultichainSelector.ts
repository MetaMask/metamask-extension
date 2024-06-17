import { useSelector, DefaultRootState } from 'react-redux';
import { InternalAccount, isEvmAccountType } from '@metamask/keyring-api';
import { getNativeCurrency } from '../ducks/metamask/metamask';
import { useMultichainNetwork } from './useMultichainNetwork';
import { getCurrentCurrency, getSelectedInternalAccount } from '../selectors';

export function useMultichainSelector<TState = DefaultRootState, TSelected = unknown>(
  selector: (state: TState, account?: InternalAccount) => TSelected,
  account?: InternalAccount,
) {
  return useSelector((state: TState) => {
    // We either pass an account or fallback to the currently selected one
    return selector(state, account || getSelectedInternalAccount(state));
  });
}
