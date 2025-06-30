import { migrate, version } from './142';

const oldVersion = 141;

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
    it('removes the isRedesignedConfirmationsDeveloperEnabled preference if it is set to true', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          PreferencesController: {
            preferences: {
              isRedesignedConfirmationsDeveloperEnabled: true,
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

    it('removes the isRedesignedConfirmationsDeveloperEnabled preference if it is set to false', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          PreferencesController: {
            preferences: {
              isRedesignedConfirmationsDeveloperEnabled: false,
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

    it('does nothing to other PreferencesController state if there is not a isRedesignedConfirmationsDeveloperEnabled preference', async () => {
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
