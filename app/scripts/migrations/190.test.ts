import { cloneDeep } from 'lodash';
import { migrate, version } from './190';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('removes seedWords when value is null', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        seedWords: null,
        PreferencesController: {
          showTestNetworks: true,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedKeys = new Set<string>();

    await migrate(versionedData, changedKeys);

    expect(versionedData.meta.version).toBe(VERSION);
    expect('seedWords' in versionedData.data).toBe(false);
    expect(versionedData.data).toStrictEqual({
      PreferencesController: {
        showTestNetworks: true,
      },
    });
    expect(changedKeys).toStrictEqual(new Set(['seedWords']));
  });

  it('keeps seedWords when value is not null', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        seedWords: 'mock-seed-phrase',
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedKeys = new Set<string>();

    await migrate(versionedData, changedKeys);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedKeys.size).toBe(0);
  });

  it('handles state when seedWords property does not exist', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          showTestNetworks: true,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedKeys = new Set<string>();

    await migrate(versionedData, changedKeys);

    expect(versionedData.meta.version).toBe(VERSION);
    expect('seedWords' in versionedData.data).toBe(false);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedKeys.size).toBe(0);
  });

  it('removes forgottenPassword when value is null', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        forgottenPassword: null,
        PreferencesController: {
          showTestNetworks: true,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedKeys = new Set<string>();

    await migrate(versionedData, changedKeys);

    expect(versionedData.meta.version).toBe(VERSION);
    expect('forgottenPassword' in versionedData.data).toBe(false);
    expect(versionedData.data).toStrictEqual({
      PreferencesController: {
        showTestNetworks: true,
      },
    });
    expect(changedKeys).toStrictEqual(new Set(['forgottenPassword']));
  });

  it('keeps forgottenPassword when value is not null', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        forgottenPassword: true,
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedKeys = new Set<string>();

    await migrate(versionedData, changedKeys);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedKeys.size).toBe(0);
  });

  it('handles state when forgottenPassword property does not exist', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          showTestNetworks: true,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedKeys = new Set<string>();

    await migrate(versionedData, changedKeys);

    expect(versionedData.meta.version).toBe(VERSION);
    expect('forgottenPassword' in versionedData.data).toBe(false);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedKeys.size).toBe(0);
  });

  it('removes both seedWords and forgottenPassword when both are null', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        seedWords: null,
        forgottenPassword: null,
        PreferencesController: {
          showTestNetworks: true,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedKeys = new Set<string>();

    await migrate(versionedData, changedKeys);

    expect(versionedData.meta.version).toBe(VERSION);
    expect('seedWords' in versionedData.data).toBe(false);
    expect('forgottenPassword' in versionedData.data).toBe(false);
    expect(versionedData.data).toStrictEqual({
      PreferencesController: {
        showTestNetworks: true,
      },
    });
    expect(changedKeys).toStrictEqual(
      new Set(['seedWords', 'forgottenPassword']),
    );
  });
});
