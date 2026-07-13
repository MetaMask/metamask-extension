import { cloneDeep } from 'lodash';
import { migrate, version } from './217';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('removes enableMV3TimestampSave from PreferencesController', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          enableMV3TimestampSave: false,
          currentLocale: 'en',
        },
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData).toStrictEqual({
      meta: { version: VERSION },
      data: {
        PreferencesController: {
          currentLocale: 'en',
        },
      },
    });
    expect(changedControllers).toStrictEqual(new Set(['PreferencesController']));
  });

  it('does not mark PreferencesController changed when enableMV3TimestampSave is absent', async () => {
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

    expect(versionedData).toStrictEqual({
      meta: { version: VERSION },
      data: oldStorage.data,
    });
    expect(changedControllers).toStrictEqual(new Set([]));
  });

  it('does nothing when PreferencesController is missing', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        AppStateController: {},
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
