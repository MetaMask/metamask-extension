import type { Migrate } from './types';

export const version = 225;

const BASIC_FUNCTIONALITY_CHILDREN = [
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

const SOCIAL_LOGIN_FLOWS = ['socialCreate', 'socialImport'];

/**
 * Whether persisted state belongs to a social-login user.
 *
 * `authConnection` lives on SeedlessOnboardingController (not
 * AuthenticationController). Empty `socialBackupsMetadata` arrays are ignored.
 *
 * @param data - Persisted MetaMask controller state.
 */
function isSocialLoginUser(data: Record<string, unknown>): boolean {
  const onboardingController = data.OnboardingController as
    | Record<string, unknown>
    | undefined;
  const seedlessOnboardingController = data.SeedlessOnboardingController as
    | Record<string, unknown>
    | undefined;

  if (
    SOCIAL_LOGIN_FLOWS.includes(
      onboardingController?.firstTimeFlowType as string,
    )
  ) {
    return true;
  }

  const socialBackupsMetadata =
    seedlessOnboardingController?.socialBackupsMetadata;
  if (
    Array.isArray(socialBackupsMetadata) &&
    socialBackupsMetadata.length > 0
  ) {
    return true;
  }

  return Boolean(seedlessOnboardingController?.authConnection);
}

/**
 * Consolidates legacy Basic Functionality preferences and schedules the
 * appropriate one-time notification.
 *
 * @param versionedData - Persisted MetaMask state.
 */
export const migrate = ((versionedData) => {
  const data = versionedData.data as Record<string, unknown>;
  const preferencesController = data.PreferencesController as
    | Record<string, unknown>
    | undefined;

  if (
    !preferencesController ||
    !Object.prototype.hasOwnProperty.call(
      preferencesController,
      'useExternalServices',
    )
  ) {
    versionedData.meta.version = version;
    return;
  }

  const preferences =
    (preferencesController.preferences as Record<string, unknown>) ?? {};
  preferencesController.preferences = preferences;

  if (preferences.isBasicFunctionalityConsolidatedEnabled === true) {
    // Backfill users who ran an earlier POC that stored the toast/modal
    // presentation choice under the old preference key.
    const legacyNotification =
      preferences.basicFunctionalityMigrationNotification;
    if (legacyNotification === 'toast' || legacyNotification === 'modal') {
      preferences.basicFunctionalityMigrationNotificationPending = true;
      delete preferences.basicFunctionalityMigrationNotification;
    }
    versionedData.meta.version = version;
    return;
  }

  const basicFunctionalityEnabled =
    preferencesController.useExternalServices === true;
  const areAllChildrenEnabled = BASIC_FUNCTIONALITY_CHILDREN.every(
    (preference) => preferencesController[preference] === true,
  );
  const areAllChildrenDisabled = BASIC_FUNCTIONALITY_CHILDREN.every(
    (preference) => preferencesController[preference] === false,
  );
  const enabledChildren = BASIC_FUNCTIONALITY_CHILDREN.filter(
    (preference) => preferencesController[preference] === true,
  ).length;
  const isSocialLogin = isSocialLoginUser(data);
  const landingState =
    basicFunctionalityEnabled || isSocialLogin || enabledChildren > 9;

  for (const preference of BASIC_FUNCTIONALITY_CHILDREN) {
    preferencesController[preference] = landingState;
  }
  preferencesController.useExternalServices = landingState;
  preferences.isBasicFunctionalityConsolidatedEnabled = true;

  const isConsistent =
    (basicFunctionalityEnabled && areAllChildrenEnabled) ||
    (!basicFunctionalityEnabled && areAllChildrenDisabled);
  preferences.basicFunctionalityMigrationNotificationPending =
    isSocialLogin || !isConsistent;

  versionedData.meta.version = version;
}) satisfies Migrate;

const migration = { version, migrate };

export default migration;
