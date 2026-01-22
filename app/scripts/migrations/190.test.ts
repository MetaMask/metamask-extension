import { cloneDeep } from 'lodash';
import { migrate, version } from './190';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('removes seedPhrase when value is null', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        seedPhrase: null,
        PreferencesController: {
          showTestNetworks: true,
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedKeys = new Set<string>();

    await migrate(versionedData, changedKeys);

    expect(versionedData.meta.version).toBe(VERSION);
    expect('seedPhrase' in versionedData.data).toBe(false);
    expect(versionedData.data).toStrictEqual({
      PreferencesController: {
        showTestNetworks: true,
      },
    });
    expect(changedKeys).toStrictEqual(new Set(['seedPhrase']));
  });

  it('keeps seedPhrase when value is not null', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        seedPhrase: 'mock-seed-phrase',
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedKeys = new Set<string>();

    await migrate(versionedData, changedKeys);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedKeys.size).toBe(0);
  });
});
