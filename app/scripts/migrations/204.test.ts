import { cloneDeep } from 'lodash';
import { migrate, version } from './204';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  it('sets useSidePanelAsDefault to true when showExtensionInFullSizeView is false', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          preferences: {
            showExtensionInFullSizeView: false,
            useSidePanelAsDefault: false,
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data.PreferencesController).toStrictEqual({
      preferences: {
        showExtensionInFullSizeView: false,
        useSidePanelAsDefault: true,
      },
      showSidePanelMigrationToast: true,
    });
    expect(changedControllers).toStrictEqual(
      new Set(['PreferencesController']),
    );
  });

  it('does nothing when useSidePanelAsDefault is already true', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          preferences: {
            showExtensionInFullSizeView: false,
            useSidePanelAsDefault: true,
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data.PreferencesController).toStrictEqual(
      oldStorage.data.PreferencesController,
    );
    expect(changedControllers.size).toBe(0);
  });

  it('does not set useSidePanelAsDefault when showExtensionInFullSizeView is true', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          preferences: {
            showExtensionInFullSizeView: true,
            useSidePanelAsDefault: false,
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data.PreferencesController).toStrictEqual({
      preferences: {
        showExtensionInFullSizeView: true,
        useSidePanelAsDefault: false,
      },
    });
    expect(changedControllers.size).toBe(0);
  });

  it('sets useSidePanelAsDefault when preferences exist but useSidePanelAsDefault is missing', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        PreferencesController: {
          preferences: {
            showExtensionInFullSizeView: false,
          },
        },
      },
    };

    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data.PreferencesController).toStrictEqual({
      preferences: {
        showExtensionInFullSizeView: false,
        useSidePanelAsDefault: true,
      },
      showSidePanelMigrationToast: true,
    });
    expect(changedControllers).toStrictEqual(
      new Set(['PreferencesController']),
    );
  });

  it('does nothing when PreferencesController is missing', async () => {
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

  it('does nothing when preferences object is missing', async () => {
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
