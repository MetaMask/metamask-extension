import {
  Infer,
  object,
  boolean,
  optional,
  assert,
} from '@metamask/superstruct';
import {
  getRemoteFeatureFlags,
  type RemoteFeatureFlagsState,
} from '../../../shared/lib/selectors/remote-feature-flags';
import {
  DEFI_CONTROLLER_V2_FLAG,
  isDefiControllerV2Enabled,
} from '../../../shared/lib/defi-controller-v2/remote-feature-flag';

/**
 * Feature flag structure for defi-controller-v-2 feature.
 */
const DefiControllerV2FeatureFlag = object({
  enabled: optional(boolean()),
});

/**
 * Feature flag type for defi-controller-v-2 feature.
 */
export type DefiControllerV2FeatureFlagType = Infer<
  typeof DefiControllerV2FeatureFlag
>;

/**
 * Selector to get the defi-controller-v-2 remote feature flag.
 *
 * @param state - The MetaMask state object
 * @returns The feature flag for defi-controller-v-2, or undefined if not set.
 */
export const getDefiControllerV2RemoteFeatureFlag = (
  state: RemoteFeatureFlagsState,
): DefiControllerV2FeatureFlagType | undefined => {
  try {
    const defiControllerV2FeatureFlag =
      getRemoteFeatureFlags(state)[DEFI_CONTROLLER_V2_FLAG];

    assert(defiControllerV2FeatureFlag, DefiControllerV2FeatureFlag);

    return defiControllerV2FeatureFlag;
  } catch (error) {
    return undefined;
  }
};

/**
 * Selector to check if the defi-controller-v-2 feature is enabled.
 *
 * @param state - The MetaMask state object
 * @returns True if the feature is enabled, false otherwise.
 */
export const getIsDefiControllerV2Enabled = (
  state: RemoteFeatureFlagsState,
): boolean =>
  isDefiControllerV2Enabled(getDefiControllerV2RemoteFeatureFlag(state));
