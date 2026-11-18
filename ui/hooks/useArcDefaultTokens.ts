import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { isEvmAccountType } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { CHAIN_IDS } from '../../shared/constants/network';
import { getNetworkConfigurationsByChainId } from '../../shared/lib/selectors/networks';
import { getInternalAccounts } from '../selectors/accounts';
import {
  getAssetsControllerCustomAssets,
  isAssetInAccountCustomAssets,
} from '../selectors/assets-unify-state/asset-preferences';
import { importCustomAssetsBatch } from '../store/actions';
import { useDispatch } from '../store/hooks';

const ARC_USDC_ASSET_ID =
  'eip155:5042/erc20:0x3600000000000000000000000000000000000000';

const ARC_DEFAULT_ASSETS = [{ assetId: ARC_USDC_ASSET_ID, isHidden: false }];

const ARC_DEFAULT_ASSETS_METADATA: Record<string, Record<string, unknown>> = {
  [ARC_USDC_ASSET_ID]: { symbol: 'USDC', name: 'USDC', decimals: 6 },
};

/**
 * Adds USDC on Arc for all EVM accounts that don't already have it, whenever
 * the Arc network is present. Also handles new accounts added after Arc.
 */
export function useArcDefaultTokens() {
  const dispatch = useDispatch();
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const allAccounts = useSelector(getInternalAccounts);
  const customAssets = useSelector(getAssetsControllerCustomAssets);

  // Tracks account IDs for which we have already dispatched, to avoid
  // re-dispatching on every render while the controller state catches up.
  const dispatchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!networkConfigurations?.[CHAIN_IDS.ARC]) {
      return;
    }

    for (const account of allAccounts as InternalAccount[]) {
      if (!isEvmAccountType(account.type)) {
        continue;
      }
      if (dispatchedRef.current.has(account.id)) {
        continue;
      }
      if (
        isAssetInAccountCustomAssets(
          customAssets,
          account.id,
          ARC_USDC_ASSET_ID,
        )
      ) {
        // Already present — mark as handled so we never re-dispatch.
        dispatchedRef.current.add(account.id);
        continue;
      }
      dispatchedRef.current.add(account.id);
      dispatch(
        importCustomAssetsBatch(
          account.id,
          ARC_DEFAULT_ASSETS,
          ARC_DEFAULT_ASSETS_METADATA,
        ),
      );
    }
  }, [networkConfigurations, allAccounts, customAssets, dispatch]);
}
