import { type RemoteFeatureFlagsState } from '../remote-feature-flags';

/**
 * Selector to check if the multichain accounts feature is enabled for state 2.
 * The feature is permanently enabled — the remote feature flag is no longer required.
 *
 * @deprecated This selector is no longer used and will be removed in the future.
 * All multichain accounts features are now enabled by default.
 * @param _state - The remote feature flags state.
 * @returns Always true.
 */
export const getIsMultichainAccountsState2Enabled = (
  _state: RemoteFeatureFlagsState,
): boolean => true;
