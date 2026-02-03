import {
  Infer,
  object,
  boolean,
  nullable,
  string,
  assert,
} from '@metamask/superstruct';
import {
  getRemoteFeatureFlags,
  type RemoteFeatureFlagsState,
} from '../remote-feature-flags';
import {
  ASSETS_UNIFY_STATE_VERSION_1,
  isAssetsUnifyStateFeatureEnabled,
} from '../../../shared/lib/assets-unify-state/remote-feature-flag';

export const ASSETS_UNIFY_STATE_FLAG = 'assetsUnifyState';

/**
 * Feature flag structure for assets-unify-state feature
 */
const AssetsUnifyStateFeatureFlag = object({
  enabled: boolean(),
  featureVersion: nullable(string()),
  minimumVersion: nullable(string()),
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
  const remoteFlag = getAssetsUnifyStateRemoteFeatureFlag(state);
  return isAssetsUnifyStateFeatureEnabled(
    remoteFlag,
    ASSETS_UNIFY_STATE_VERSION_1,
  );
};
