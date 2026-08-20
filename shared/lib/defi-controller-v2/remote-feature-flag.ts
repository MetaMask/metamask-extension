/**
 * Client-config / RemoteFeatureFlagController key (camelCase). LaunchDarkly
 * may use a kebab-case key that is converted before it reaches the extension.
 */
export const DEFI_CONTROLLER_V2_FLAG = 'defiControllerV2';

/**
 * Shape of the `defiControllerV2` remote feature flag after it has been
 * resolved by `RemoteFeatureFlagController`. The controller processes the raw
 * version-scoped / threshold format and stores only the matching value
 * (e.g. `{ enabled: true }`).
 *
 * Raw remote config template (version gating + threshold rollout). Version
 * keys are minimum SemVer floors; the highest key `<=` the client version is
 * selected, then threshold arrays are bucketed. With `thresholdVersion: 2`,
 * the selected entry's `value` is stored directly (not wrapped as
 * `{ name, value }`). `scope.value` is cumulative in `[0, 1]` (e.g. `0.1` =
 * 10% of users).
 *
 * @example
 * ```json
 * {
 *   "versions": {
 *     "13.41.0": {
 *       "enabled": false
 *     },
 *     "13.42.0": [
 *       {
 *         "scope": {
 *           "type": "threshold",
 *           "value": 0.1
 *         },
 *         "thresholdName": "feature is ON for 10% of users",
 *         "thresholdVersion": 2,
 *         "value": {
 *           "enabled": true
 *         }
 *       },
 *       {
 *         "scope": {
 *           "type": "threshold",
 *           "value": 1
 *         },
 *         "thresholdName": "feature is OFF for remaining users",
 *         "thresholdVersion": 2,
 *         "value": {
 *           "enabled": false
 *         }
 *       }
 *     ]
 *   }
 * }
 * ```
 */
export type DefiControllerV2FeatureFlag = {
  enabled?: boolean;
};

/**
 * Shared helper to check whether the defiControllerV2 feature is enabled.
 * Keeps background and UI gating logic in sync.
 *
 * @param featureFlag - The defiControllerV2 feature flag.
 * @returns boolean - True if the feature is enabled, false otherwise.
 */
export const isDefiControllerV2Enabled = (
  featureFlag: DefiControllerV2FeatureFlag | undefined | null,
): boolean => Boolean(featureFlag?.enabled);
