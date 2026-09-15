import { cloneDeep } from 'lodash';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import { BFT_CHILD_PREFERENCES } from '../../../shared/lib/basic-functionality-consolidation';
import { migrate, version } from './227';

const VERSION = version;
const OLD_VERSION = 226;

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

function buildChildPreferences(enabled: boolean) {
  return Object.fromEntries(
    BFT_CHILD_PREFERENCES.map((preference) => [preference, enabled]),
  );
}

function buildPreferencesController({
  useExternalServices,
  childrenEnabled,
  isConsolidated = false,
  notificationDismissed = false,
  childOverrides = {},
}: {
  useExternalServices: boolean;
  childrenEnabled: boolean;
  isConsolidated?: boolean;
  notificationDismissed?: boolean;
  childOverrides?: Partial<
    Record<(typeof BFT_CHILD_PREFERENCES)[number], boolean>
  >;
}) {
  return {
    useExternalServices,
    isMultiAccountBalancesEnabled: useExternalServices,
    ...buildChildPreferences(childrenEnabled),
    ...childOverrides,
    preferences: {
      isBasicFunctionalityConsolidatedEnabled: isConsolidated,
      basicFunctionalityMigrationNotification: null,
      basicFunctionalityMigrationNotificationDismissed: notificationDismissed,
    },
  };
}

describe(`migration #${VERSION}`, () => {
  it('bumps the version', async () => {
    const versionedData: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {},
    };

    await migrate(versionedData, new Set<string>());

    expect(versionedData.meta.version).toBe(VERSION);
  });

  it('consolidates an unmarked wallet when the cached remote flag is on', async () => {
    const versionedData: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        RemoteFeatureFlagController: {
          remoteFeatureFlags: {
            extensionBasicFunctionalityToggle: true,
          },
        },
        PreferencesController: buildPreferencesController({
          useExternalServices: true,
          childrenEnabled: true,
        }),
      },
    };
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    const preferencesController = versionedData.data.PreferencesController as {
      useExternalServices: boolean;
      isMultiAccountBalancesEnabled: boolean;
      preferences: {
        isBasicFunctionalityConsolidatedEnabled: boolean;
        basicFunctionalityMigrationNotification: string | null;
      };
    } & Record<(typeof BFT_CHILD_PREFERENCES)[number], boolean>;

    expect(preferencesController.useExternalServices).toBe(true);
    expect(preferencesController.isMultiAccountBalancesEnabled).toBe(true);
    for (const preference of BFT_CHILD_PREFERENCES) {
      expect(preferencesController[preference]).toBe(true);
    }
    expect(
      preferencesController.preferences.isBasicFunctionalityConsolidatedEnabled,
    ).toBe(true);
    expect(
      preferencesController.preferences.basicFunctionalityMigrationNotification,
    ).toBeNull();
    expect(changedControllers).toStrictEqual(
      new Set(['PreferencesController']),
    );
  });

  it('does not rewrite prefs when the cached remote flag is off', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        RemoteFeatureFlagController: {
          remoteFeatureFlags: {
            extensionBasicFunctionalityToggle: false,
          },
        },
        PreferencesController: buildPreferencesController({
          useExternalServices: true,
          childrenEnabled: true,
        }),
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('does not rewrite prefs when the cached remote flag is missing', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: buildPreferencesController({
          useExternalServices: true,
          childrenEnabled: true,
        }),
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('leaves an already consolidated wallet alone', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        RemoteFeatureFlagController: {
          remoteFeatureFlags: {
            extensionBasicFunctionalityToggle: true,
          },
        },
        PreferencesController: buildPreferencesController({
          useExternalServices: false,
          childrenEnabled: false,
          isConsolidated: true,
        }),
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('turns Basic Functionality on for a social-login wallet that had it off', async () => {
    const versionedData: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        RemoteFeatureFlagController: {
          remoteFeatureFlags: {
            extensionBasicFunctionalityToggle: true,
          },
        },
        OnboardingController: {
          firstTimeFlowType: FirstTimeFlowType.socialCreate,
        },
        PreferencesController: buildPreferencesController({
          useExternalServices: false,
          childrenEnabled: false,
        }),
      },
    };

    await migrate(versionedData, new Set<string>());

    const preferencesController = versionedData.data.PreferencesController as {
      useExternalServices: boolean;
      preferences: {
        isBasicFunctionalityConsolidatedEnabled: boolean;
        basicFunctionalityMigrationNotification: string | null;
      };
    };

    expect(preferencesController.useExternalServices).toBe(true);
    expect(
      preferencesController.preferences.isBasicFunctionalityConsolidatedEnabled,
    ).toBe(true);
    expect(
      preferencesController.preferences.basicFunctionalityMigrationNotification,
    ).toBe('modal');
  });

  it('aligns mixed child preferences and queues a toast', async () => {
    const versionedData: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        RemoteFeatureFlagController: {
          remoteFeatureFlags: {
            extensionBasicFunctionalityToggle: true,
          },
        },
        OnboardingController: {
          firstTimeFlowType: FirstTimeFlowType.create,
        },
        PreferencesController: buildPreferencesController({
          useExternalServices: false,
          childrenEnabled: false,
          childOverrides: {
            useTokenDetection: true,
            usePhishDetect: true,
          },
        }),
      },
    };

    await migrate(versionedData, new Set<string>());

    const preferencesController = versionedData.data.PreferencesController as {
      useExternalServices: boolean;
      useTokenDetection: boolean;
      preferences: {
        basicFunctionalityMigrationNotification: string | null;
      };
    };

    expect(preferencesController.useExternalServices).toBe(false);
    expect(preferencesController.useTokenDetection).toBe(false);
    expect(
      preferencesController.preferences.basicFunctionalityMigrationNotification,
    ).toBe('toast');
  });

  it('does not queue a notice when the user already dismissed it', async () => {
    const versionedData: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        RemoteFeatureFlagController: {
          remoteFeatureFlags: {
            extensionBasicFunctionalityToggle: true,
          },
        },
        PreferencesController: buildPreferencesController({
          useExternalServices: false,
          childrenEnabled: false,
          notificationDismissed: true,
          childOverrides: {
            useTokenDetection: true,
          },
        }),
      },
    };

    await migrate(versionedData, new Set<string>());

    const preferencesController = versionedData.data.PreferencesController as {
      preferences: {
        basicFunctionalityMigrationNotification: string | null;
      };
    };

    expect(
      preferencesController.preferences.basicFunctionalityMigrationNotification,
    ).toBeNull();
  });

  it('reads a version-gated cached remote flag', async () => {
    const versionedData: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        RemoteFeatureFlagController: {
          remoteFeatureFlags: {
            extensionBasicFunctionalityToggle: {
              enabled: true,
              minimumVersion: '0.0.0',
            },
          },
        },
        PreferencesController: buildPreferencesController({
          useExternalServices: true,
          childrenEnabled: true,
        }),
      },
    };
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(changedControllers.has('PreferencesController')).toBe(true);
  });
});
