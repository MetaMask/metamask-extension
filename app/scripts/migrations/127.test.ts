import { migrate, version } from './127';

const oldVersion = version - 1;

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
        useNftDetection: true,
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
});
