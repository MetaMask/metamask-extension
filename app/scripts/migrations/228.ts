import { hasProperty, isObject } from '@metamask/utils';
import { v4 as uuidv4 } from 'uuid';
import {
  BFT_CHILD_PREFERENCES,
  getBasicFunctionalityConsolidationPlan,
  isBasicFunctionalitySocialLoginUser,
  shouldStartBasicFunctionalityConsolidation,
  type BasicFunctionalityPreferenceState,
} from '../../../shared/lib/basic-functionality-consolidation';
import { getIsBasicFunctionalityConsolidationEnabledInBuild } from '../../../shared/lib/environment';
import { getBooleanFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import type { Migrate } from './types';

export const version = 228;

/**
 * One-shot Basic Functionality consolidation for unmarked wallets when either:
 * - the cached remote flag is already on (kill-switch path for BF-on users), or
 * - the build flag is on and Basic Functionality is off (BF-off users cannot
 * fetch remote flags).
 *
 * Complements the runtime hook for users whose remote flag turns on later.
 *
 * @param versionedData - Versioned MetaMask extension state; what we persist to disk.
 * @param changedControllers - `Set` to track which controller keys were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const consolidationResult = consolidateBasicFunctionalityFromCachedFlag(
    versionedData.data,
  );
  if (!consolidationResult) {
    return;
  }

  changedControllers.add('PreferencesController');
  if (consolidationResult.shouldTrackMigratedEvent) {
    enqueueBasicFunctionalityMigratedEvent(
      versionedData.data,
      consolidationResult.landingState,
      consolidationResult.isSocialLogin,
    );
    changedControllers.add('AnalyticsController');
  }
}) satisfies Migrate;

type ConsolidationResult = {
  landingState: boolean;
  isSocialLogin: boolean;
  shouldTrackMigratedEvent: boolean;
};

function consolidateBasicFunctionalityFromCachedFlag(
  state: Record<string, unknown>,
): ConsolidationResult | false {
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
  const hasConsolidationMarker =
    preferences.isBasicFunctionalityConsolidatedEnabled === true;
  const useExternalServices =
    preferencesController.useExternalServices === true;

  if (
    !shouldStartBasicFunctionalityConsolidation({
      isRemoteFlagEnabled: isCachedBasicFunctionalityToggleEnabled(state),
      isBuildFlagEnabled: getIsBasicFunctionalityConsolidationEnabledInBuild(),
      useExternalServices,
      hasConsolidationMarker,
    })
  ) {
    return false;
  }

  const preferenceState = {
    useExternalServices,
  } as BasicFunctionalityPreferenceState;
  for (const preference of BFT_CHILD_PREFERENCES) {
    preferenceState[preference] = preferencesController[preference] === true;
  }

  const isSocialLogin = getIsSocialLoginUser(state);
  const { landingState, notification, isConsistent } =
    getBasicFunctionalityConsolidationPlan(preferenceState, isSocialLogin);
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

  return {
    landingState,
    isSocialLogin,
    // Aligned wallets (including aligned social) are not on this event.
    shouldTrackMigratedEvent: !isConsistent,
  };
}

/**
 * Queues `Basic Functionality Migrated` for unaligned upgrades so it still
 * ships when consolidation runs before controllers are up.
 *
 * @param state - Persisted extension state.
 * @param landingState - Consolidated Basic Functionality landing value.
 * @param isSocialLogin - Whether this wallet is a social-login user.
 */
function enqueueBasicFunctionalityMigratedEvent(
  state: Record<string, unknown>,
  landingState: boolean,
  isSocialLogin: boolean,
): void {
  const analyticsController =
    hasProperty(state, 'AnalyticsController') &&
    isObject(state.AnalyticsController)
      ? (state.AnalyticsController as Record<string, unknown>)
      : ((state.AnalyticsController = {}) as Record<string, unknown>);

  const existingEventQueue =
    hasProperty(analyticsController, 'eventQueue') &&
    isObject(analyticsController.eventQueue)
      ? (analyticsController.eventQueue as Record<string, unknown>)
      : {};

  const messageId = uuidv4();
  analyticsController.eventQueue = {
    ...existingEventQueue,
    [messageId]: {
      type: 'track',
      eventName: MetaMetricsEventName.BasicFunctionalityMigrated,
      messageId,
      timestamp: new Date().toISOString(),
      properties: {
        category: MetaMetricsEventCategory.Settings,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        routed_bf_state: landingState ? 'on' : 'off',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        is_social_login: isSocialLogin,
      },
    },
  };
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
