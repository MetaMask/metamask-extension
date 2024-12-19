import { migrate, version } from './135';

const oldVersion = 134;

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
    it('removes the useRequestQueue preference', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          PreferencesController: {
            preferences: {
              useRequestQueue: true,
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

    it('does nothing if the preferences does not have a useRequestQueue preference', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          PreferencesController: {
            preferences: {},
          },
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('does nothing to other preferences if they exist without a useRequestQueue preference', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          PreferencesController: {
            preferences: {
              existingPreference: true,
            },
          },
        },
      };

      const expectedData = {
        PreferencesController: {
          preferences: {
            existingPreference: true,
          },
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });
  });
});
