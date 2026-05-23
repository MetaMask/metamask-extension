import { cloneDeep } from 'lodash';
import { migrate, version } from './202';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('removes useBlockie from PreferencesController', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          useBlockie: true,
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

  it('does nothing when useBlockie is missing', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          currentLocale: 'en',
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
