import { hasProperty, isObject } from '@metamask/utils';
import {
  BFT_CHILD_PREFERENCES,
  getBasicFunctionalityConsolidationPlan,
  isBasicFunctionalitySocialLoginUser,
  type BasicFunctionalityPreferenceState,
} from '../../../shared/lib/basic-functionality-consolidation';
import { getBooleanFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';
import type { Migrate } from './types';

export const version = 227;

/**
 * One-shot Basic Functionality consolidation for wallets whose cached remote
 * flag is already on. Complements the runtime hook, which still consolidates
 * users whose cache was off or missing at upgrade and later receive the flag.
 *
 * @param versionedData - Versioned MetaMask extension state; what we persist to disk.
 * @param changedControllers - `Set` to track which controller keys were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  if (consolidateBasicFunctionalityFromCachedFlag(versionedData.data)) {
    changedControllers.add('PreferencesController');
  }
}) satisfies Migrate;

function consolidateBasicFunctionalityFromCachedFlag(
  state: Record<string, unknown>,
): boolean {
  if (!isCachedBasicFunctionalityToggleEnabled(state)) {
    return false;
  }

  if (
    !hasProperty(state, 'PreferencesController') ||
    !isObject(state.PreferencesController)
  ) {
    return false;
  }

  const preferencesController = state.PreferencesController;
  if (!hasProperty(preferencesController, 'preferences')) {
    preferencesController.preferences = {};
  }
  if (!isObject(preferencesController.preferences)) {
    return false;
  }

  const { preferences } = preferencesController;
  if (preferences.isBasicFunctionalityConsolidatedEnabled === true) {
    return false;
  }

  const preferenceState = {
    useExternalServices: preferencesController.useExternalServices === true,
  } as BasicFunctionalityPreferenceState;
  for (const preference of BFT_CHILD_PREFERENCES) {
    preferenceState[preference] = preferencesController[preference] === true;
  }

  const { landingState, notification } = getBasicFunctionalityConsolidationPlan(
    preferenceState,
    getIsSocialLoginUser(state),
  );
  const hasDismissedNotice =
    preferences.basicFunctionalityMigrationNotificationDismissed === true;

  preferencesController.useExternalServices = landingState;
  for (const preference of BFT_CHILD_PREFERENCES) {
    preferencesController[preference] = landingState;
  }
  preferencesController.isMultiAccountBalancesEnabled = landingState;
  preferences.isBasicFunctionalityConsolidatedEnabled = true;
  preferences.basicFunctionalityMigrationNotification = hasDismissedNotice
    ? null
    : notification;

  return true;
}

function isCachedBasicFunctionalityToggleEnabled(
  state: Record<string, unknown>,
): boolean {
  if (
    !hasProperty(state, 'RemoteFeatureFlagController') ||
    !isObject(state.RemoteFeatureFlagController) ||
    !hasProperty(state.RemoteFeatureFlagController, 'remoteFeatureFlags') ||
    !isObject(state.RemoteFeatureFlagController.remoteFeatureFlags)
  ) {
    return false;
  }

  return getBooleanFeatureFlag(
    state.RemoteFeatureFlagController.remoteFeatureFlags
      .extensionBasicFunctionalityToggle,
    false,
  );
}

function getIsSocialLoginUser(state: Record<string, unknown>): boolean {
  let firstTimeFlowType: string | undefined;
  if (
    hasProperty(state, 'OnboardingController') &&
    isObject(state.OnboardingController) &&
    typeof state.OnboardingController.firstTimeFlowType === 'string'
  ) {
    firstTimeFlowType = state.OnboardingController.firstTimeFlowType;
  }

  let authConnection: string | undefined;
  if (
    hasProperty(state, 'SeedlessOnboardingController') &&
    isObject(state.SeedlessOnboardingController) &&
    typeof state.SeedlessOnboardingController.authConnection === 'string'
  ) {
    authConnection = state.SeedlessOnboardingController.authConnection;
  }

  return isBasicFunctionalitySocialLoginUser({
    firstTimeFlowType,
    authConnection,
  });
}
