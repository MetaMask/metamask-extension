import { useSyncExternalStore } from 'react';

import {
  isAccountGroupAssetLoadPending,
  subscribeToAccountGroupAssetLoads,
} from '../../utils/account-group-asset-loader';
import { useAccountOverrideGroupId } from './useAccountOverrideGroupId';

/**
 * Whether the token list is waiting on a first-time asset load for the
 * transaction's pay account override.
 *
 * Lets consumers distinguish "this account genuinely holds nothing" from "we
 * have not fetched this account's assets yet", which are otherwise identical
 * (both an empty list).
 *
 * @returns True while the override account group's initial asset fetch is in
 * flight.
 */
export function useAccountTokensLoading(): boolean {
  const overrideGroupId = useAccountOverrideGroupId();

  return useSyncExternalStore(subscribeToAccountGroupAssetLoads, () =>
    isAccountGroupAssetLoadPending(overrideGroupId),
  );
}
