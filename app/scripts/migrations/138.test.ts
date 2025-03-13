import { migrate, version } from './138';

const oldVersion = 137;

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
    it('removes the redesignedTransactionsEnabled preference if it is set to true', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          PreferencesController: {
            preferences: {
              redesignedTransactionsEnabled: true,
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

    it('removes the redesignedTransactionsEnabled preference if it is set to false', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          PreferencesController: {
            preferences: {
              redesignedTransactionsEnabled: false,
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

    it('does nothing to other PreferencesController state if there is not a redesignedTransactionsEnabled preference', async () => {
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
