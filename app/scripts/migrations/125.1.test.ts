import { migrate, version } from './125.1';

const oldVersion = 125;

describe(`migration #${version}`, () => {
  afterEach(() => jest.resetAllMocks());

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('Gracefully handles empty/undefined PreferencesController', async () => {
    for (const PreferencesController of [{}, undefined, null, 1, '', []]) {
      const oldStorage = {
        meta: { version: oldVersion },
        data: { PreferencesController },
      };

      const newStorage = await migrate(oldStorage);
      expect(newStorage.data.TxController).toStrictEqual(undefined);
    }
  });

  it('Enables token autodetection when basic functionality is on', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          useExternalServices: true,
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toEqual({
      PreferencesController: {
        useExternalServices: true,
        useTokenDetection: true,
      },
    });
  });

  it('Does not enable token autodetection when basic functionality is off', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          useExternalServices: false,
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toEqual({
      PreferencesController: {
        useExternalServices: false,
      },
    });
  });

  it('Removes showTokenAutodetectModalOnUpgrade from the app metadata controller', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AppMetadataController: {
          previousMigrationVersion: oldVersion,
          currentMigrationVersion: version,
          showTokenAutodetectModalOnUpgrade: null,
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toEqual({
      AppMetadataController: {
        previousMigrationVersion: oldVersion,
        currentMigrationVersion: version,
      },
    });
  });

  it('Does nothing if showTokenAutodetectModalOnUpgrade is not in the app metadata controller', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        AppMetadataController: {
          previousMigrationVersion: oldVersion,
          currentMigrationVersion: version,
        },
      },
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toEqual({
      AppMetadataController: {
        previousMigrationVersion: oldVersion,
        currentMigrationVersion: version,
      },
    });
  });
});
