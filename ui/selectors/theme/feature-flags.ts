/**
 * @file Feature flags for theme/design-system rollout.
 *
 * NOTE: This file is temporary. Once pure-black and dark theme tokens are
 * consolidated into a single token set, this file and its associated provider
 * wiring should be removed. Tracked in TMCU-1083.
 */

import { createSelector } from 'reselect';
import { getBooleanFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';

/**
 * Get the state of the `extensionUxPureBlack` remote feature flag.
 *
 * @param _state - The MetaMask state object
 * @returns boolean - True if the pure black (OLED) dark mode is enabled, false otherwise.
 */
export const getIsPureBlackEnabled = createSelector(
  getRemoteFeatureFlags,
  ({ extensionUxPureBlack }) =>
    getBooleanFeatureFlag(extensionUxPureBlack, false),
);
