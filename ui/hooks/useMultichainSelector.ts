import { useSelector, DefaultRootState } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { getSelectedInternalAccount } from '../selectors';

export function useMultichainSelector<
  TState = DefaultRootState,
  TSelected = unknown,
>(
  selector: (state: TState, account?: InternalAccount) => TSelected,
  account?: InternalAccount | null,
) {
  return useSelector((state: TState) => {
    // We either pass an account or fallback to the currently selected one
    // @ts-expect-error state types don't match
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    return selector(state, account || getSelectedInternalAccount(state));
  });
}
