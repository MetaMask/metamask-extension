import { migrate, version } from './225';

const children = [
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
];

function buildState(
  useExternalServices: boolean,
  enabledChildren: number,
  {
    firstTimeFlowType,
    authConnection,
    socialBackupsMetadata,
    isBasicFunctionalityConsolidatedEnabled = false,
    basicFunctionalityMigrationNotification,
  }: {
    firstTimeFlowType?: string;
    authConnection?: string;
    socialBackupsMetadata?: unknown[];
    isBasicFunctionalityConsolidatedEnabled?: boolean;
    basicFunctionalityMigrationNotification?: 'toast' | 'modal';
  } = {},
) {
  return {
    meta: { version: version - 1 },
    data: {
      PreferencesController: {
        useExternalServices,
        ...Object.fromEntries(
          children.map((preference, index) => [
            preference,
            index < enabledChildren,
          ]),
        ),
        preferences: {
          isBasicFunctionalityConsolidatedEnabled,
          ...(basicFunctionalityMigrationNotification
            ? { basicFunctionalityMigrationNotification }
            : {}),
        },
      },
      OnboardingController: { firstTimeFlowType },
      SeedlessOnboardingController: {
        authConnection,
        socialBackupsMetadata,
      },
    },
  };
}

describe(`migration #${version}`, () => {
  it('consolidates mixed settings and schedules a toast', async () => {
    const versionedData = buildState(true, 3);

    await migrate(versionedData);

    expect(versionedData.data.PreferencesController.useExternalServices).toBe(
      true,
    );
    expect(
      versionedData.data.PreferencesController.preferences
        .basicFunctionalityMigrationNotificationPending,
    ).toBe(true);
  });

  it('does not schedule a notification for consistent settings', async () => {
    const versionedData = buildState(false, 0);

    await migrate(versionedData);

    expect(
      versionedData.data.PreferencesController.preferences
        .basicFunctionalityMigrationNotificationPending,
    ).toBe(false);
  });

  it('schedules a modal for social-login users via firstTimeFlowType', async () => {
    const versionedData = buildState(false, 0, {
      firstTimeFlowType: 'socialCreate',
    });

    await migrate(versionedData);

    expect(
      versionedData.data.PreferencesController.preferences
        .basicFunctionalityMigrationNotificationPending,
    ).toBe(true);
  });

  it('schedules a modal for social-login users via SeedlessOnboardingController.authConnection', async () => {
    const versionedData = buildState(false, 0, {
      authConnection: 'google',
    });

    await migrate(versionedData);

    expect(
      versionedData.data.PreferencesController.preferences
        .basicFunctionalityMigrationNotificationPending,
    ).toBe(true);
    expect(versionedData.data.PreferencesController.useExternalServices).toBe(
      true,
    );
  });

  it('ignores empty socialBackupsMetadata when detecting social login', async () => {
    const versionedData = buildState(false, 0, {
      socialBackupsMetadata: [],
    });

    await migrate(versionedData);

    expect(
      versionedData.data.PreferencesController.preferences
        .basicFunctionalityMigrationNotificationPending,
    ).toBe(false);
  });

  it('backfills pending notification from the legacy preference key', async () => {
    const versionedData = buildState(true, 12, {
      isBasicFunctionalityConsolidatedEnabled: true,
      basicFunctionalityMigrationNotification: 'toast',
    });

    await migrate(versionedData);

    expect(
      versionedData.data.PreferencesController.preferences
        .basicFunctionalityMigrationNotificationPending,
    ).toBe(true);
    expect(
      versionedData.data.PreferencesController.preferences
        .basicFunctionalityMigrationNotification,
    ).toBeUndefined();
  });
});
