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
  firstTimeFlowType?: string,
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
          isBasicFunctionalityConsolidatedEnabled: false,
        },
      },
      OnboardingController: { firstTimeFlowType },
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

  it('schedules a modal for social-login users', async () => {
    const versionedData = buildState(false, 0, 'socialCreate');

    await migrate(versionedData);

    expect(
      versionedData.data.PreferencesController.preferences
        .basicFunctionalityMigrationNotificationPending,
    ).toBe(true);
  });
});
