import type { InternalAccount } from '@metamask/keyring-internal-api';
import type { DefaultRootState } from 'react-redux';
import { useSelector } from 'react-redux';

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
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
    return selector(state, account || getSelectedInternalAccount(state));
  });
}
