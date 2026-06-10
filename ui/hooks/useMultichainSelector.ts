import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { getSelectedInternalAccount } from '../../shared/lib/selectors/accounts';
import type { MetaMaskReduxState } from '../store/store';

export function useMultichainSelector<
  TState = MetaMaskReduxState,
  TSelected = unknown,
>(
  selector: (state: TState, account?: InternalAccount) => TSelected,
  account?: InternalAccount | null,
) {
  const memoizedSelector = useCallback(
    (state: TState) => {
      // We either pass an account or fallback to the currently selected one
      // @ts-expect-error state types don't match
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      return selector(state, account || getSelectedInternalAccount(state));
    },
    [selector, account],
  );
  return useSelector(memoizedSelector);
}
