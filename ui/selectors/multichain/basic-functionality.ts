import { createSelector } from 'reselect';
import { getIsUnlocked } from '../../ducks/metamask/base-selectors';
import { getBooleanFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import {
  BFT_CHILD_PREFERENCES,
  EXTERNAL_SERVICES_OWNED_PREFERENCES,
  type ExternalServicesOwnedPreference,
} from '../../../shared/lib/basic-functionality-consolidation';
import { isBasicFunctionalityConsistent } from '../../../shared/lib/basic-functionality-consolidation-gate';

export { BFT_CHILD_PREFERENCES };

/**
 * Gets the current value of every preference that
 * `PreferencesController.toggleExternalServices` overwrites. Returns a new
 * object each call, so read it with `shallowEqual`.
 *
 * @param state - The MetaMask state object.
 * @param state.metamask - The flattened background state slice.
 */
export const getExternalServicesOwnedPreferences = (state: {
  metamask: Record<string, unknown>;
}): Record<ExternalServicesOwnedPreference, boolean> =>
  Object.fromEntries(
    EXTERNAL_SERVICES_OWNED_PREFERENCES.map((preference) => [
      preference,
      Boolean(state.metamask[preference]),
    ]),
  ) as Record<ExternalServicesOwnedPreference, boolean>;

/**
 * Gets whether the Basic Functionality consolidation rollout is enabled.
 */
export const getIsBasicFunctionalityToggleEnabled = createSelector(
  getRemoteFeatureFlags,
  ({ extensionBasicFunctionalityToggle }) =>
    getBooleanFeatureFlag(extensionBasicFunctionalityToggle, false),
);

/**
 * Gets whether a user has a consistent all-on or all-off BFT configuration.
 */
const getIsBasicFunctionalityConsistent = createSelector(
  (state) => state.metamask,
  (metamaskState) => isBasicFunctionalityConsistent(metamaskState),
);

const getBasicFunctionalityMigrationNotification = (state: {
  metamask: {
    preferences?: {
      basicFunctionalityMigrationNotification?: 'modal' | 'toast' | null;
      basicFunctionalityMigrationNotificationDismissed?: boolean;
    };
  };
}) => state.metamask.preferences?.basicFunctionalityMigrationNotification;

const getIsBasicFunctionalityMigrationNotificationDismissed = (state: {
  metamask: {
    preferences?: {
      basicFunctionalityMigrationNotificationDismissed?: boolean;
    };
  };
}) =>
  Boolean(
    state.metamask.preferences
      ?.basicFunctionalityMigrationNotificationDismissed,
  );

export const getShouldShowBasicFunctionalityMigrationModal = createSelector(
  getBasicFunctionalityMigrationNotification,
  getIsBasicFunctionalityMigrationNotificationDismissed,
  (notification, isDismissed) => notification === 'modal' && !isDismissed,
);

export const getShouldShowBasicFunctionalityMigrationToast = createSelector(
  getBasicFunctionalityMigrationNotification,
  getIsBasicFunctionalityMigrationNotificationDismissed,
  getIsUnlocked,
  (notification, isDismissed, isUnlocked) =>
    notification === 'toast' && !isDismissed && isUnlocked,
);

/**
 * Gets whether the consolidated Basic Functionality experience should be shown.
 *
 * A wallet is marked as consolidated either at onboarding (build flag) or by the
 * one-time migration (remote flag). That marker is one-way: once it is set the
 * wallet keeps the consolidated experience even if the remote flag is later
 * turned off, so the child preferences cannot diverge behind the consolidated
 * toggle.
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
    isPersistedConsolidatedUser ||
    (isBasicFunctionalityToggleEnabled && isConsistentLegacyUser),
);
