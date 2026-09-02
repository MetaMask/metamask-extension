import { cloneDeep } from 'lodash';
import { migrate, version } from './224';

const childPreferences = [
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
          childPreferences.map((preference, index) => [
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
  it('enables Basic Functionality for legacy users with more than nine children enabled', async () => {
    const versionedData = buildState(false, 10);

    await migrate(versionedData, new Set<string>());

    expect(versionedData.data.PreferencesController.useExternalServices).toBe(
      true,
    );
    expect(
      versionedData.data.PreferencesController.preferences
        .isBasicFunctionalityConsolidatedEnabled,
    ).toBe(true);
    expect(
      versionedData.data.PreferencesController.preferences
        .basicFunctionalityMigrationNotification,
    ).toBe('toast');
  });

  it('shows the modal for social-login users with Basic Functionality off', async () => {
    const versionedData = buildState(false, 0, 'socialCreate');

    const migratedData = cloneDeep(versionedData);
    await migrate(migratedData, new Set<string>());
    expect(
      migratedData.data.PreferencesController.preferences
        .basicFunctionalityMigrationNotification,
    ).toBe('modal');
  });

  it('aligns every child preference with the landing state', async () => {
    const versionedData = buildState(false, 3);

    await migrate(versionedData, new Set<string>());

    for (const preference of childPreferences) {
      expect(versionedData.data.PreferencesController[preference]).toBe(false);
    }
  });
});
