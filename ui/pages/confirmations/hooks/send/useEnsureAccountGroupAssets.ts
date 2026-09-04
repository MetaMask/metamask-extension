import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useSelector } from 'react-redux';
import type { AccountGroupId } from '@metamask/account-api';
import type { AssetType } from '@metamask/assets-controller';
import type { CaipChainId, Hex } from '@metamask/utils';

import { getIsAssetsUnifyStateEnabled } from '../../../../selectors/assets-unify-state';
import { getAllMultichainNetworkConfigurations } from '../../../../selectors/multichain/networks';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/lib/selectors/networks';
import { getInternalAccountsFromGroupById } from '../../../../selectors/multichain-accounts/account-tree';
import {
  refreshAssetsForSelectedAccount,
  updateBalancesFoAccounts,
} from '../../../../store/actions';
import { useDispatch } from '../../../../store/hooks';
import {
  hasRequestedAccountGroupAssets,
  isAccountGroupAssetLoadPending,
  runAccountGroupAssetLoad,
  subscribeToAccountGroupAssetLoads,
} from '../../utils/account-group-asset-loader';

/** Fungible holdings only — matches token lists / MM Pay pay-with. */
const FUNGIBLE_ASSET_TYPES: AssetType[] = ['fungible'];
const EMPTY_ACCOUNTS: ReturnType<typeof getInternalAccountsFromGroupById> = [];

/**
 * Ensures assets are loaded for an account group that is not the globally
 * selected one, and reports whether that load is still in flight.
 *
 * Automatic asset loading is scoped to the selected account group, so reading
 * assets for an override account (MM Pay "Pay with" while a different account
 * is selected) yields an empty list until the group has been activated at least
 * once. This hook closes that gap by requesting the data on demand.
 *
 * The load spans every configured network rather than the user's currently
 * enabled-network filter. A never-selected override account has no assets in
 * state on any chain, and the funding token (e.g. USDC on Arbitrum) is often on
 * a network that is not in the active filter (which, in the deposit flow, can be
 * a single testnet). Scoping to the filter would only ever fetch that one chain
 * and the token list would stay empty; scoping to all networks mirrors what the
 * selected-account path accumulates over time.
 *
 * Loading is deliberately limited to the single overridden account rather than
 * every account on screen: fanning asset fetches out across a large wallet is a
 * known performance cost, so only the account actually being paid from is
 * fetched.
 *
 * @param accountGroupId - Account group to load, or undefined to no-op.
 * @returns Whether an asset load for that group is currently in flight.
 */
export function useEnsureAccountGroupAssets(
  accountGroupId?: AccountGroupId,
): boolean {
  const dispatch = useDispatch();
  const isAssetsUnifyStateEnabled = useSelector(getIsAssetsUnifyStateEnabled);
  const allMultichainNetworks = useSelector(
    getAllMultichainNetworkConfigurations,
  );
  const evmNetworkConfigurations = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const caipChainIds = useMemo(
    () => Object.keys(allMultichainNetworks) as CaipChainId[],
    [allMultichainNetworks],
  );
  const evmChainIds = useMemo(
    () => Object.keys(evmNetworkConfigurations) as Hex[],
    [evmNetworkConfigurations],
  );

  const accounts = useSelector((state) =>
    accountGroupId
      ? getInternalAccountsFromGroupById(state, accountGroupId)
      : EMPTY_ACCOUNTS,
  );

  const isPending = useSyncExternalStore(
    subscribeToAccountGroupAssetLoads,
    () => isAccountGroupAssetLoadPending(accountGroupId),
  );

  useEffect(() => {
    if (!accountGroupId || !accounts?.length) {
      return;
    }

    if (hasRequestedAccountGroupAssets(accountGroupId)) {
      return;
    }

    // Wait until the relevant chain list is populated before requesting. The
    // loader marks a group as requested for the whole session, so kicking off a
    // load with no chains would resolve as a no-op success and dedupe the group
    // permanently — it would never retry once the chains become available,
    // leaving the token list empty.
    const chainIdsToLoad = isAssetsUnifyStateEnabled
      ? caipChainIds
      : evmChainIds;
    if (chainIdsToLoad.length === 0) {
      return;
    }

    // Groups already requested this session are deduped inside the loader, so
    // re-running this effect after an unrelated selector change costs nothing.
    runAccountGroupAssetLoad([accountGroupId], async () => {
      if (isAssetsUnifyStateEnabled) {
        await dispatch(
          refreshAssetsForSelectedAccount(accounts, {
            chainIds: caipChainIds,
            assetTypes: FUNGIBLE_ASSET_TYPES,
          }),
        );
        return;
      }

      // Legacy path: TokenBalancesController only includes non-selected
      // accounts when queryAllAccounts is true.
      await dispatch(updateBalancesFoAccounts(evmChainIds, true));
    });
  }, [
    accountGroupId,
    accounts,
    caipChainIds,
    dispatch,
    evmChainIds,
    isAssetsUnifyStateEnabled,
  ]);

  return isPending;
}
