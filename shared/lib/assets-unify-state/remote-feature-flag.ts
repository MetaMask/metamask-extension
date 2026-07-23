import { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';

export const ASSETS_UNIFY_STATE_FLAG = 'assetsUnifyState';

export const ASSETS_UNIFY_STATE_VERSION_1 = '1';

export type AssetsUnifyStateFeatureFlag = {
  enabled: boolean;
  featureVersion: string | null;
  minimumVersion?: string | null;
  deprecatedControllers?: string[];
};

/**
 * Shared helper to check whether the assets-unify-state feature is enabled
 * for a given application version. This keeps background and UI gating logic in sync.
 *
 * In test environments the flag is always considered enabled so that E2E and
 * unit tests do not need to set up the remote feature-flag machinery.
 *
 * @param featureFlag - The assets-unify-state feature flag.
 * @param featureVersion - The feature version to check.
 * @returns boolean - True if the feature is enabled, false otherwise.
 */
export const isAssetsUnifyStateFeatureEnabled = (
  featureFlag: AssetsUnifyStateFeatureFlag | undefined | null,
  featureVersion: string,
): boolean => {
  if (process.env.IN_TEST) {
    return true;
  }
  return (
    Boolean(featureFlag?.enabled) &&
    featureFlag?.featureVersion === featureVersion
  );
};

/**
 * Returns true if the given controller is listed as deprecated in the
 * assets-unify-state remote feature flag.
 *
 * In test environments the controller is always considered deprecated so that
 * tests do not need to configure remote feature-flag state.
 *
 * @param remoteFeatureFlags - The remote feature flags state.
 * @param controllerName - The controller name to check (e.g. 'TokenListController').
 * @returns boolean
 */
export const getIsDeprecatedController = (
  remoteFeatureFlags: RemoteFeatureFlagControllerState['remoteFeatureFlags'],
  controllerName: string,
): boolean => {
  if (process.env.IN_TEST) {
    return true;
  }

  const flag = remoteFeatureFlags?.[ASSETS_UNIFY_STATE_FLAG] as
    | AssetsUnifyStateFeatureFlag
    | undefined;

  return flag?.deprecatedControllers?.includes(controllerName) ?? false;
};
