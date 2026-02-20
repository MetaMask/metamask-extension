/**
 * Selector for AssetsController state when assets-unify-state is enabled.
 * Returns assetPreferences so the UI can check if an asset is hidden (in preferences)
 * and should be unhidden rather than added as a new custom asset.
 */

/**
 * Shape of a single entry in AssetsController.assetPreferences
 */
export type AssetPreferenceEntry = {
  hidden?: boolean;
  [key: string]: unknown;
};

/**
 * Asset preferences keyed by normalized CAIP-19 asset ID.
 */
export type AssetPreferencesState = Record<string, AssetPreferenceEntry>;

/**
 * Custom assets state: accountId -> array of CAIP-19 asset IDs.
 */
export type CustomAssetsState = Record<string, string[]>;

type AssetsControllerRootState = {
  metamask?: {
    assetPreferences?: AssetPreferencesState;
    customAssets?: CustomAssetsState;
  };
};

const EMPTY_ASSET_PREFERENCES: AssetPreferencesState = Object.freeze({});

/**
 * Returns the assetPreferences from AssetsController state.
 * When AssetsController is not present (feature off or not initialized), returns empty object.
 *
 * @param state - Redux state (root or metamask slice)
 * @returns assetPreferences object from AssetsController, or {} if not available
 */
export function getAssetsControllerAssetPreferences(
  state: AssetsControllerRootState,
): AssetPreferencesState {
  return state.metamask?.assetPreferences ?? EMPTY_ASSET_PREFERENCES;
}

/**
 * Returns the customAssets from AssetsController state.
 *
 * @param state - Redux state (root or metamask slice)
 */
export function getAssetsControllerCustomAssets(
  state: AssetsControllerRootState,
): CustomAssetsState | undefined {
  return state.metamask?.customAssets;
}

/**
 * Returns whether an assetId is in the customAssets list for the given account.
 * Uses exact and case-insensitive match (controller stores normalized IDs).
 *
 * @param customAssets - from getAssetsControllerCustomAssets
 * @param accountId - account ID
 * @param assetId - CAIP-19 asset ID
 */
export function isAssetInAccountCustomAssets(
  customAssets: CustomAssetsState | undefined,
  accountId: string,
  assetId: string,
): boolean {
  if (!customAssets) {
    return false;
  }
  const list = customAssets[accountId];
  if (!list?.length) {
    return false;
  }
  if (list.includes(assetId)) {
    return true;
  }
  const lower = assetId.toLowerCase();
  return list.some((id) => id.toLowerCase() === lower);
}

/**
 * Returns whether an asset is currently in assetPreferences with hidden: true.
 * Use this to decide whether to call unhideAsset vs addCustomAsset when (re-)adding a token.
 * Checks both exact key match and case-insensitive key match (controller may store checksummed IDs).
 *
 * @param state - Redux state
 * @param assetId - CAIP-19 asset ID (normalized form in state may differ; we check by key presence)
 * @returns true if the asset has a preference entry with hidden === true
 */
export function isAssetHiddenInPreferences(
  state: AssetsControllerRootState,
  assetId: string,
): boolean {
  const preferences = getAssetsControllerAssetPreferences(state);
  return isAssetIdHiddenInPreferencesMap(preferences, assetId);
}

/**
 * Given an assetPreferences map and an assetId, returns true if that asset has hidden: true.
 * Uses exact key match first, then case-insensitive key match (controller stores checksummed IDs).
 *
 * @param assetPreferences - assetPreferences from getAssetsControllerAssetPreferences
 * @param assetId - CAIP-19 asset ID
 * @returns true if the asset is marked hidden
 */
export function isAssetIdHiddenInPreferencesMap(
  assetPreferences: AssetPreferencesState,
  assetId: string,
): boolean {
  const exact = assetPreferences[assetId];
  if (exact?.hidden) {
    return true;
  }
  const keyMatch = Object.keys(assetPreferences).find(
    (k) => k.toLowerCase() === assetId.toLowerCase(),
  );
  return Boolean(keyMatch && assetPreferences[keyMatch]?.hidden);
}
