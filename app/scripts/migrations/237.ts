import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 237;

const ARC_ERC20_USDC_ASSET_ID =
  'eip155:5042/erc20:0x3600000000000000000000000000000000000000';

/**
 * Migration 237: Remove the Arc ERC-20 USDC custom asset.
 *
 * The app used to import `eip155:5042/erc20:0x3600...` as a custom asset for
 * every EVM account. AssetsController now default-tracks Arc's native USDC, so
 * the ERC-20 entry is removed from `AssetsController.customAssets`. Accounts
 * left with no custom assets are removed from the map.
 *
 * @param versionedData - Versioned MetaMask extension state; what we persist
 * to disk.
 * @param changedKeys - `Set` to track which controller keys were modified.
 */
export const migrate = (async (versionedData, changedKeys) => {
  versionedData.meta.version = version;

  const state = versionedData.data as Record<string, unknown>;

  if (
    !hasProperty(state, 'AssetsController') ||
    !isObject(state.AssetsController) ||
    !isObject(state.AssetsController.customAssets)
  ) {
    return;
  }

  const { customAssets } = state.AssetsController;
  let changed = false;

  for (const [accountId, assetIds] of Object.entries(customAssets)) {
    if (!Array.isArray(assetIds)) {
      continue;
    }

    const remainingAssetIds = assetIds.filter(
      (assetId) =>
        typeof assetId !== 'string' ||
        assetId.toLowerCase() !== ARC_ERC20_USDC_ASSET_ID,
    );

    if (remainingAssetIds.length === assetIds.length) {
      continue;
    }

    changed = true;
    if (remainingAssetIds.length === 0) {
      delete customAssets[accountId];
    } else {
      customAssets[accountId] = remainingAssetIds;
    }
  }

  if (changed) {
    changedKeys.add('AssetsController');
  }
}) satisfies Migrate;

export default migrate;
