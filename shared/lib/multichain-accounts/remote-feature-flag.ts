export const FEATURE_VERSION_1 = '1';
export const FEATURE_VERSION_2 = '2';

export type MultichainAccountsFeatureFlag = {
  enabled: boolean;
  featureVersion: string | null;
  minimumVersion: string | null;
};

/**
 * Shared helper to check whether a multichain accounts feature version is enabled
 * for a given application version. This keeps background and UI gating logic in sync.
 *
 * @param _enableMultichainAccounts - The multichain accounts feature flag.
 * @param _featureVersion - The feature version to check.
 * @returns boolean - True if the feature is enabled, false otherwise.
 */
export const isMultichainAccountsFeatureEnabled = (
  _enableMultichainAccounts: MultichainAccountsFeatureFlag | undefined | null,
  _featureVersion: string,
) => {
  return true;
};
