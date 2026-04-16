import { cloneDeep } from 'lodash';
import { migrate, version } from './198';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('removes identities, lostIdentities, and selectedAddress when all are present', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          identities: {
            '0x1': { name: 'Account 1', address: '0x1' },
          },
          lostIdentities: {
            '0x2': { name: 'Account 2', address: '0x2' },
          },
          selectedAddress: '0x1',
          currentLocale: 'en',
          preferences: { showTestNetworks: true },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual({
      PreferencesController: {
        currentLocale: 'en',
        preferences: { showTestNetworks: true },
      },
    });
    expect(changedControllers).toStrictEqual(
      new Set(['PreferencesController']),
    );
  });

  it('removes only the properties that exist when a subset is present', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          identities: {
            '0x1': { name: 'Account 1', address: '0x1' },
          },
          selectedAddress: '0x1',
          currentLocale: 'en',
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual({
      PreferencesController: {
        currentLocale: 'en',
      },
    });
    expect(changedControllers).toStrictEqual(
      new Set(['PreferencesController']),
    );
  });

  it('does nothing when none of the properties exist', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          currentLocale: 'en',
          preferences: { showTestNetworks: true },
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

  it('does nothing when PreferencesController does not exist', async () => {
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

  it('does nothing when PreferencesController is not an object', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: 'not an object',
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
