import { migrate, version } from './170.1';

const oldVersion = 170;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('removes the smartAccountOptInForAccounts preference', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          preferences: {
            smartAccountOptInForAccounts: [],
          },
        },
      },
    };
    const expectedData = {
      PreferencesController: { preferences: {} },
    };
    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(expectedData);
  });

  it('does nothing to other PreferencesController state if there is not a smartAccountOptInForAccounts preference', async () => {
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
