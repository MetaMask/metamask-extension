import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 229;

/**
 * Auto-imported Arc ERC-20 USDC identity. Duplicate of native Arc USDC
 * (`eip155:5042/slip44:5042`); pinning it as a custom asset made Accounts
 * API v6 treat Arc as failed (`unprocessedIncludeAssetIds`).
 */
const ARC_ERC20_USDC_ASSET_ID =
  'eip155:5042/erc20:0x3600000000000000000000000000000000000000';

const ARC_ERC20_USDC_ASSET_ID_LOWER = ARC_ERC20_USDC_ASSET_ID.toLowerCase();

function isArcErc20Usdc(assetId: unknown): boolean {
  return (
    typeof assetId === 'string' &&
    assetId.toLowerCase() === ARC_ERC20_USDC_ASSET_ID_LOWER
  );
}

/**
 * Strip the auto-imported Arc ERC-20 USDC pin from AssetsController state.
 *
 * Removes it from `customAssets` (the includeAssetIds source), leftover
 * `assetsBalance` entries, `assetsInfo` metadata, and `assetPreferences`.
 * Native Arc USDC (`slip44:5042`) is left untouched.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const data = versionedData.data as Record<string, unknown>;

  if (
    !hasProperty(data, 'AssetsController') ||
    !isObject(data.AssetsController)
  ) {
    return;
  }

  const assetsController = data.AssetsController as Record<string, unknown>;
  let changed = false;

  if (
    hasProperty(assetsController, 'customAssets') &&
    isObject(assetsController.customAssets)
  ) {
    const customAssets = assetsController.customAssets as Record<
      string,
      unknown
    >;
    for (const [accountId, assetIds] of Object.entries(customAssets)) {
      if (!Array.isArray(assetIds)) {
        continue;
      }
      const filtered = assetIds.filter((id) => !isArcErc20Usdc(id));
      if (filtered.length === assetIds.length) {
        continue;
      }
      if (filtered.length === 0) {
        delete customAssets[accountId];
      } else {
        customAssets[accountId] = filtered;
      }
      changed = true;
    }
  }

  if (
    hasProperty(assetsController, 'assetsBalance') &&
    isObject(assetsController.assetsBalance)
  ) {
    const assetsBalance = assetsController.assetsBalance as Record<
      string,
      unknown
    >;
    for (const balances of Object.values(assetsBalance)) {
      if (!isObject(balances)) {
        continue;
      }
      for (const assetId of Object.keys(balances)) {
        if (isArcErc20Usdc(assetId)) {
          delete balances[assetId];
          changed = true;
        }
      }
    }
  }

  changed = stripAssetKeyedMap(assetsController, 'assetsInfo') || changed;
  changed = stripAssetKeyedMap(assetsController, 'assetPreferences') || changed;

  if (changed) {
    changedControllers.add('AssetsController');
  }
}) satisfies Migrate;

function stripAssetKeyedMap(
  assetsController: Record<string, unknown>,
  key: string,
): boolean {
  if (!hasProperty(assetsController, key) || !isObject(assetsController[key])) {
    return false;
  }

  const map = assetsController[key] as Record<string, unknown>;
  let changed = false;
  for (const assetId of Object.keys(map)) {
    if (isArcErc20Usdc(assetId)) {
      delete map[assetId];
      changed = true;
    }
  }
  return changed;
}
