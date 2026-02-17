import { hasMinimumRequiredVersion } from '../feature-flags/version-gating';

export const ASSETS_UNIFY_STATE_VERSION_1 = '1';

export type AssetsUnifyStateFeatureFlag = {
  enabled: boolean;
  featureVersion: string | null;
  minimumVersion: string | null;
};

/**
 * Shared helper to check whether the assets-unify-state feature is enabled
 * for a given application version. This keeps background and UI gating logic in sync.
 *
 * @param featureFlag - The assets-unify-state feature flag.
 * @param featureVersion - The feature version to check.
 * @returns boolean - True if the feature is enabled, false otherwise.
 */
export const isAssetsUnifyStateFeatureEnabled = (
  featureFlag: AssetsUnifyStateFeatureFlag | undefined | null,
  featureVersion: string,
): boolean => {
  if (!featureFlag) {
    return false;
  }

  if (!featureFlag.enabled) {
    return false;
  }

  // Check if the feature version matches
  if (featureFlag.featureVersion !== featureVersion) {
    return false;
  }

  // Check if the app version meets the minimum required version
  if (
    featureFlag.minimumVersion &&
    !hasMinimumRequiredVersion(featureFlag.minimumVersion)
  ) {
    return false;
  }

  return true;
};
