import { cloneDeep } from 'lodash';
import { migrate, version } from './203';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('maps PreferencesController currentLocale from es to es_419', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          currentLocale: 'es',
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual({
      PreferencesController: {
        currentLocale: 'es_419',
      },
    });
    expect(changedControllers).toStrictEqual(
      new Set(['PreferencesController']),
    );
  });

  it('does nothing when currentLocale is not es', async () => {
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
