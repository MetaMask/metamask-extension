import { migrate, version } from './150';

const oldVersion = 149;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe(`migration #${version}`, () => {
    it('removes the petnamesEnabled preference if it is set to true', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          PreferencesController: {
            preferences: {
              petnamesEnabled: true,
            },
          },
        },
      };
      const expectedData = {
        PreferencesController: {
          preferences: {},
        },
      };
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });

    it('removes the petnamesEnabled preference if it is set to false', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          PreferencesController: {
            preferences: {
              petnamesEnabled: false,
            },
          },
        },
      };
      const expectedData = {
        PreferencesController: {
          preferences: {},
        },
      };
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });

    it('does nothing to other PreferencesController state if there is not a petnamesEnabled preference', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          PreferencesController: {
            existingPreference: true,
          },
        },
      };

      const expectedData = {
        PreferencesController: {
          existingPreference: true,
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });
  });
});
