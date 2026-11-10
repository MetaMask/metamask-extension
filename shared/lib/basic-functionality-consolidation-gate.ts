import type { FeatureFlags } from '@metamask/remote-feature-flag-controller';
import type { Preferences } from '../types/preferences';
import {
  BFT_CHILD_PREFERENCES,
  type BasicFunctionalityPreferenceState,
} from './basic-functionality-consolidation';
import { getBooleanFeatureFlag } from './remote-feature-flag-utils';

/**
 * True when Basic Functionality and every child preference are aligned
 * all-on or all-off. Used by both the UI selector and background gate
 * helpers so they cannot drift.
 *
 * @param preferences - Preference values (controller state or flattened UI
 * metamask slice).
 */
export function isBasicFunctionalityConsistent(
  preferences: BasicFunctionalityPreferenceState,
): boolean {
  const basicFunctionalityEnabled = preferences.useExternalServices === true;
  const basicFunctionalityDisabled = preferences.useExternalServices === false;
  const areAllChildrenEnabled = BFT_CHILD_PREFERENCES.every(
    (preference) => preferences[preference] === true,
  );
  const areAllChildrenDisabled = BFT_CHILD_PREFERENCES.every(
    (preference) => preferences[preference] === false,
  );

  return (
    (basicFunctionalityEnabled && areAllChildrenEnabled) ||
    (basicFunctionalityDisabled && areAllChildrenDisabled)
  );
}

/**
 * Background counterpart of the UI's `getIsBasicFunctionalityConsolidationEnabled`
 * selector; keep the two in lockstep. A persisted cohort (set at onboarding
 * by the `BFT_CONSOLIDATION_ENABLED` build flag, or by the remote-flag
 * migration) is sufficient on its own; otherwise the remote flag must be on
 * and prefs must be consistent all-on or all-off.
 *
 * @param params - Inputs from RemoteFeatureFlagController and
 * PreferencesController.
 * @param params.remoteFeatureFlags - Remote feature flag map.
 * @param params.preferencesState - PreferencesController state.
 */
export function getIsBasicFunctionalityConsolidationGateEnabled({
  remoteFeatureFlags,
  preferencesState,
}: {
  remoteFeatureFlags: FeatureFlags;
  preferencesState: BasicFunctionalityPreferenceState & {
    preferences: Preferences;
  };
}): boolean {
  const isRemoteFlagEnabled = getBooleanFeatureFlag(
    remoteFeatureFlags.extensionBasicFunctionalityToggle,
    false,
  );
  const isPersistedConsolidatedUser = Boolean(
    preferencesState.preferences.isBasicFunctionalityConsolidatedEnabled,
  );

  return (
    isPersistedConsolidatedUser ||
    (isRemoteFlagEnabled && isBasicFunctionalityConsistent(preferencesState))
  );
}
