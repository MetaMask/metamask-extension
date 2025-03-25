import { migrate, version } from './151';

const oldVersion = 150;

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
    it('removes the incomingTransactionsPreferences preference', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          PreferencesController: {
            preferences: {
              incomingTransactionsPreferences: { 0x1: true },
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

    it('removes the showIncomingTransactions preference', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          PreferencesController: {
            preferences: {
              showIncomingTransactions: { 0x1: true },
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

    it('does nothing to other PreferencesController state if there is no incomingTransactionsPreferences, showIncomingTransactions preference', async () => {
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
