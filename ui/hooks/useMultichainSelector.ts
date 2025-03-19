import { useSelector, DefaultRootState } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-api';
import { getSelectedInternalAccount } from '../selectors';

export function useMultichainSelector<
  TState = DefaultRootState,
  TSelected = unknown,
>(
  selector: (state: TState, account?: InternalAccount) => TSelected,
  account?: InternalAccount,
) {
  return useSelector((state: TState) => {
    // We either pass an account or fallback to the currently selected one
    // @ts-expect-error state types don't match
    return selector(state, account || getSelectedInternalAccount(state));
  });
}
