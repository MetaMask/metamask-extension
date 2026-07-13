export const DEFI_CONTROLLER_V2_FLAG = 'defi-controller-v-2';

/**
 * Shape of the `defi-controller-v-2` remote feature flag after it has been
 * resolved by `RemoteFeatureFlagController`. The controller processes the raw
 * version-scoped format (`{ versions: { "13.41.0": { enabled: true } } }`)
 * and stores only the matching version's value.
 */
export type DefiControllerV2FeatureFlag = {
  enabled?: boolean;
};

/**
 * Shared helper to check whether the defi-controller-v-2 feature is enabled.
 * Keeps background and UI gating logic in sync.
 *
 * @param featureFlag - The defi-controller-v-2 feature flag.
 * @returns boolean - True if the feature is enabled, false otherwise.
 */
export const isDefiControllerV2Enabled = (
  featureFlag: DefiControllerV2FeatureFlag | undefined | null,
): boolean => Boolean(featureFlag?.enabled) || true;
