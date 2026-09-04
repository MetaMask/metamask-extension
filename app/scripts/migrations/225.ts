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
  const isSocialLogin =
    SOCIAL_LOGIN_FLOWS.includes(
      (data.OnboardingController as Record<string, unknown> | undefined)
        ?.firstTimeFlowType as string,
    ) ||
    Boolean(
      (data.SeedlessOnboardingController as Record<string, unknown> | undefined)
        ?.socialBackupsMetadata,
    ) ||
    Boolean(
      (data.AuthenticationController as Record<string, unknown> | undefined)
        ?.authConnection,
    );
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
