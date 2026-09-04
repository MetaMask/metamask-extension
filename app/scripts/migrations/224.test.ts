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

/* eslint-disable @typescript-eslint/naming-convention */
type TestPreferencesController = Record<string, unknown> & {
  preferences: Record<string, unknown>;
  useExternalServices: boolean;
};

function buildState(
  useExternalServices: boolean,
  enabledChildren: number,
  firstTimeFlowType?: string,
): {
  meta: { version: number };
  data: {
    PreferencesController: TestPreferencesController;
    OnboardingController: unknown;
  };
} {
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
      } as TestPreferencesController,
      OnboardingController: { firstTimeFlowType },
    },
  };
}
/* eslint-enable @typescript-eslint/naming-convention */

describe(`migration #${version}`, () => {
  it('does not notify users whose settings were already consistent', async () => {
    for (const versionedData of [
      buildState(true, childPreferences.length),
      buildState(false, 0),
    ]) {
      await migrate(versionedData, new Set<string>());

      expect(
        versionedData.data.PreferencesController.preferences
          .basicFunctionalityMigrationNotificationPending,
      ).toBe(false);
    }
  });

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
        .basicFunctionalityMigrationNotificationPending,
    ).toBe(true);
  });

  it('shows the modal for social-login users with Basic Functionality off', async () => {
    const versionedData = buildState(false, 0, 'socialCreate');

    const migratedData = cloneDeep(versionedData);
    await migrate(migratedData, new Set<string>());
    expect(
      migratedData.data.PreferencesController.preferences
        .basicFunctionalityMigrationNotificationPending,
    ).toBe(true);
  });

  it('aligns every child preference with the landing state', async () => {
    const versionedData = buildState(false, 3);

    await migrate(versionedData, new Set<string>());

    for (const preference of childPreferences) {
      expect(versionedData.data.PreferencesController[preference]).toBe(false);
    }
    expect(
      versionedData.data.PreferencesController.preferences
        .basicFunctionalityMigrationNotificationPending,
    ).toBe(true);
  });
});

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('removes canTrackWalletFundsObtained from AppStateController', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AppStateController: {
          canTrackWalletFundsObtained: true,
          connectedStatusPopoverHasBeenShown: true,
        },
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData).toStrictEqual({
      meta: { version: VERSION },
      data: {
        AppStateController: {
          connectedStatusPopoverHasBeenShown: true,
        },
      },
    });
    expect(changedControllers).toStrictEqual(new Set(['AppStateController']));
  });

  it('does not mark AppStateController changed when canTrackWalletFundsObtained is absent', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AppStateController: {
          connectedStatusPopoverHasBeenShown: true,
        },
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData).toStrictEqual({
      meta: { version: VERSION },
      data: oldStorage.data,
    });
    expect(changedControllers).toStrictEqual(new Set([]));
  });

  it('does nothing when AppStateController is missing', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {},
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData).toStrictEqual({
      meta: { version: VERSION },
      data: oldStorage.data,
    });
    expect(changedControllers).toStrictEqual(new Set([]));
  });

  it('does nothing when AppStateController is not an object', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AppStateController: 'not an object',
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData).toStrictEqual({
      meta: { version: VERSION },
      data: oldStorage.data,
    });
    expect(changedControllers).toStrictEqual(new Set([]));
  });
});
