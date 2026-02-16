import { cloneDeep } from 'lodash';
import { migrate, version } from './195';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('removes smartAccountOptIn from preferences', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          preferences: {
            smartAccountOptIn: true,
            showTestNetworks: true,
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(
      'smartAccountOptIn' in
        (
          versionedData.data.PreferencesController as {
            preferences: Record<string, unknown>;
          }
        ).preferences,
    ).toBe(false);
    expect(versionedData.data).toStrictEqual({
      PreferencesController: {
        preferences: {
          showTestNetworks: true,
        },
      },
    });
    expect(changedControllers).toStrictEqual(
      new Set(['PreferencesController']),
    );
  });

  it('handles state when smartAccountOptIn is false', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          preferences: {
            smartAccountOptIn: false,
            showTestNetworks: true,
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(
      'smartAccountOptIn' in
        (
          versionedData.data.PreferencesController as {
            preferences: Record<string, unknown>;
          }
        ).preferences,
    ).toBe(false);
    expect(changedControllers).toStrictEqual(
      new Set(['PreferencesController']),
    );
  });

  it('handles state when smartAccountOptIn does not exist', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          preferences: {
            showTestNetworks: true,
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('handles state when PreferencesController does not exist', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        SomeOtherController: {},
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('handles state when preferences does not exist', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          showTestNetworks: true,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });
});
