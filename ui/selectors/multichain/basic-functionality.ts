import { createSelector } from 'reselect';
import { getBooleanFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';

export const BFT_CHILD_PREFERENCES = [
  'useCurrencyRateCheck',
  'securityAlertsEnabled',
  'usePhishDetect',
  'useMultiAccountBalanceChecker',
  'useSafeChainsListValidation',
  'useTokenDetection',
  'useTransactionSimulations',
  'use4ByteResolution',
  'openSeaEnabled',
  'useNftDetection',
  'useExternalNameSources',
  'useAddressBarEnsResolution',
] as const;

/**
 * Gets whether the Basic Functionality consolidation rollout is enabled.
 */
export const getIsBasicFunctionalityToggleEnabled = createSelector(
  getRemoteFeatureFlags,
  ({ extensionBasicFunctionalityToggle }) => true
);

/**
 * Gets whether a user has a consistent all-on or all-off BFT configuration.
 */
const getIsBasicFunctionalityConsistent = createSelector(
  (state) => state.metamask,
  (metamaskState) => {
    const bftValue = metamaskState.useExternalServices;
    const areAllChildrenEnabled = BFT_CHILD_PREFERENCES.every(
      (preference) => metamaskState[preference] === true,
    );
    const areAllChildrenDisabled = BFT_CHILD_PREFERENCES.every(
      (preference) => metamaskState[preference] === false,
    );

    return (
      (bftValue === true && areAllChildrenEnabled) ||
      (bftValue === false && areAllChildrenDisabled)
    );
  },
);

/**
 * Gets whether the consolidated Basic Functionality experience should be shown.
 * The LD flag controls rollout eligibility. Persisted cohort users and legacy
 * users with a consistent all-on or all-off configuration are eligible.
 */
export const getIsBasicFunctionalityConsolidationEnabled = createSelector(
  getIsBasicFunctionalityToggleEnabled,
  (state) =>
    Boolean(
      state.metamask.preferences?.isBasicFunctionalityConsolidatedEnabled,
    ),
  getIsBasicFunctionalityConsistent,
  (
    isBasicFunctionalityToggleEnabled,
    isPersistedConsolidatedUser,
    isConsistentLegacyUser,
  ) =>
    isBasicFunctionalityToggleEnabled &&
    (isPersistedConsolidatedUser || isConsistentLegacyUser),
);
