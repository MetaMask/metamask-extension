import {
  Infer,
  object,
  boolean,
  nullable,
  string,
  array,
  assert,
  optional,
} from '@metamask/superstruct';
import {
  getRemoteFeatureFlags,
  type RemoteFeatureFlagsState,
} from '../../../shared/lib/selectors/remote-feature-flags';
import {
  ASSETS_UNIFY_STATE_FLAG,
  ASSETS_UNIFY_STATE_VERSION_1,
  isAssetsUnifyStateFeatureEnabled,
} from '../../../shared/lib/assets-unify-state/remote-feature-flag';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../shared/lib/environment';

/**
 * Feature flag structure for assets-unify-state feature
 */
const AssetsUnifyStateFeatureFlag = object({
  enabled: boolean(),
  featureVersion: nullable(string()),
  minimumVersion: optional(nullable(string())),
  deprecatedControllers: optional(array(string())),
});

/**
 * Feature flag type for assets-unify-state feature
 */
export type AssetsUnifyStateFeatureFlagType = Infer<
  typeof AssetsUnifyStateFeatureFlag
>;

/**
 * Selector to get the assets-unify-state remote feature flag.
 *
 * @param state - The MetaMask state object
 * @returns AssetsUnifyStateFeatureFlagType - The feature flag for assets-unify-state, or undefined if not set.
 */
export const getAssetsUnifyStateRemoteFeatureFlag = (
  state: RemoteFeatureFlagsState,
): AssetsUnifyStateFeatureFlagType | undefined => {
  try {
    const assetsUnifyStateFeatureFlag =
      getRemoteFeatureFlags(state)[ASSETS_UNIFY_STATE_FLAG];

    assert(assetsUnifyStateFeatureFlag, AssetsUnifyStateFeatureFlag);

    return assetsUnifyStateFeatureFlag;
  } catch (error) {
    return undefined;
  }
};

/**
 * Selector to check if the assets-unify-state feature is enabled.
 * When enabled, the UI will use the unified AssetsController state
 * for both EVM and non-EVM assets.
 *
 * @param state - The MetaMask state object
 * @returns boolean - True if the feature is enabled, false otherwise.
 */
export const getIsAssetsUnifyStateEnabled = (
  state: RemoteFeatureFlagsState,
): boolean => {
  if (!getIsAssetsUnifiedStateIncludedInBuild()) {
    return false;
  }
  const remoteFlag = getAssetsUnifyStateRemoteFeatureFlag(state);
  return isAssetsUnifyStateFeatureEnabled(
    remoteFlag,
    ASSETS_UNIFY_STATE_VERSION_1,
  );
};

/**
 * Selector to check whether a given controller has been deprecated by the
 * assets-unify-state rollout.
 *
 * In test environments (`IN_TEST`) the controller is always considered
 * deprecated so that tests do not need to configure remote feature-flag state.
 *
 * Build-time and version gating is handled by {@link getIsAssetsUnifyStateEnabled}.
 * When that returns true, this simply checks whether the controller name
 * appears in the flag's `deprecatedControllers` list.
 *
 * @param state - The MetaMask state object
 * @param controllerName - The controller name to check (e.g. 'TokenListController').
 * @returns boolean - True if the controller is deprecated, false otherwise.
 */
export const getIsControllerDeprecated = (
  state: RemoteFeatureFlagsState,
  controllerName: string,
): boolean => {
  if (process.env.IN_TEST) {
    return true;
  }

  if (!getIsAssetsUnifyStateEnabled(state)) {
    return false;
  }

  const featureFlag = getAssetsUnifyStateRemoteFeatureFlag(state);
  return featureFlag?.deprecatedControllers?.includes(controllerName) ?? false;
};

/**
 * Selector to check whether the `TokenListController` has been deprecated by
 * the assets-unify-state rollout for the running app version.
 *
 * @param state - The MetaMask state object
 * @returns boolean - True if `TokenListController` is deprecated, false otherwise.
 */
export const getIsTokenListControllerDeprecated = (
  state: RemoteFeatureFlagsState,
): boolean => getIsControllerDeprecated(state, 'TokenListController');
